import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Rate limiting - simple in-memory implementation
// For production, consider using Redis or a similar distributed solution
const requestCounts: Record<string, { count: number, reset: number }> = {};
const RATE_LIMIT = 5; // 5 requests per minute per token
const RATE_WINDOW = 60 * 1000; // 1 minute

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { pathname } = new URL(request.url);
    
    // Extract token from path (assuming format is /api/webhook/trading-view/{token})
    const pathParts = pathname.split('/');
    const token = pathParts[pathParts.length - 1];
    
    if (!token) {
      return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 });
    }
    
    // Rate limiting check
    const now = Date.now();
    if (requestCounts[token]) {
      if (now < requestCounts[token].reset) {
        if (requestCounts[token].count >= RATE_LIMIT) {
          return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }
        requestCounts[token].count++;
      } else {
        // Reset window
        requestCounts[token] = { count: 1, reset: now + RATE_WINDOW };
      }
    } else {
      requestCounts[token] = { count: 1, reset: now + RATE_WINDOW };
    }
    
    // Find the webhook in database
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('id, user_id, is_active, request_count')
      .eq('token', token)
      .single();
    
    if (webhookError || !webhook) {
      return NextResponse.json({ error: 'Invalid webhook token' }, { status: 401 });
    }
    
    if (!webhook.is_active) {
      return NextResponse.json({ error: 'Webhook is inactive' }, { status: 403 });
    }
    
    // Parse request body - TradingView alerts are JSON
    let orderData;
    try {
      orderData = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    
    // Validate required fields from TradingView
    if (!orderData.symbol || !orderData.action || !orderData.quantity) {
      return NextResponse.json({ 
        error: 'Missing required fields. Expected: symbol, action, quantity' 
      }, { status: 400 });
    }
    
    // Update webhook usage statistics
    await supabase
      .from('webhooks')
      .update({
        last_used_at: new Date().toISOString(),
        request_count: webhook.request_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', webhook.id);
    
    // Get active broker credentials for the user
    const { data: brokerCreds, error: brokerError } = await supabase
      .from('broker_credentials')
      .select('*')
      .eq('user_id', webhook.user_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (brokerError || !brokerCreds) {
      // Log the webhook request for manual processing
      await supabase.from('webhook_logs').insert({
        webhook_id: webhook.id,
        user_id: webhook.user_id,
        payload: orderData,
        status: 'failed',
        error_message: 'No active broker found'
      });
      
      return NextResponse.json({ 
        error: 'No active broker found for this user',
        queued: true 
      }, { status: 200 });
    }
    
    // Format based on broker
    const transactionType = orderData.action.toUpperCase() === 'BUY' ? 'BUY' : 'SELL';
    const broker = brokerCreds.broker_name.toLowerCase();
    
    // Determine which broker API to call
    let apiEndpoint = '';
    let formattedOrder = {};
    
    switch (broker) {
      case 'angelone':
        apiEndpoint = '/api/brokers/angelone/place-order';
        formattedOrder = {
          broker_id: brokerCreds.id,
          order_details: {
            symbol: orderData.symbol,
            order_side: transactionType,
            quantity: orderData.quantity,
            order_type: orderData.orderType || 'MARKET',
            price: orderData.price || '0',
            product: orderData.productType || 'INTRADAY'
          }
        };
        break;
        
      case 'fyers':
        apiEndpoint = '/api/brokers/fyers/place-order';
        formattedOrder = {
          broker_id: brokerCreds.id,
          order_details: {
            symbol: orderData.symbol,
            transactionType: transactionType,
            quantity: orderData.quantity,
            orderType: orderData.orderType || 'MARKET',
            price: orderData.price,
            productType: orderData.productType || 'INTRADAY',
            triggerPrice: orderData.triggerPrice
          }
        };
        break;
        
      case 'upstox':
        apiEndpoint = '/api/brokers/upstox/place-order';
        formattedOrder = {
          broker_id: brokerCreds.id,
          order_details: {
            instrument_key: orderData.symbol,
            transaction_type: transactionType,
            quantity: orderData.quantity,
            order_type: orderData.orderType || 'MARKET',
            price: orderData.price,
            product_type: orderData.productType || 'INTRADAY',
            trigger_price: orderData.triggerPrice
          }
        };
        break;
        
      default:
        return NextResponse.json({ 
          error: `Unsupported broker: ${broker}` 
        }, { status: 400 });
    }
    
    // Call the broker API
    const orderResponse = await fetch(new URL(apiEndpoint, request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formattedOrder)
    });
    
    const orderResult = await orderResponse.json();
    
    // Log the order result
    await supabase.from('webhook_logs').insert({
      webhook_id: webhook.id,
      user_id: webhook.user_id,
      payload: orderData,
      status: orderResponse.ok ? 'success' : 'failed',
      response: orderResult,
      error_message: !orderResponse.ok ? JSON.stringify(orderResult.error) : null
    });
    
    if (!orderResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to place order with broker',
        details: orderResult
      }, { status: orderResponse.status });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Order submitted successfully',
      order_id: orderResult.data?.order_id || orderResult.data?.id || 'unknown',
      broker: broker
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 