'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Declare cashfree type for TypeScript
declare global {
  interface Window {
    Cashfree: any;
  }
}

export default function SimplePayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [directCheckoutReady, setDirectCheckoutReady] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  
  // Load Cashfree SDK for Direct Checkout fallback
  useEffect(() => {
    // Only load the script once
    if (!document.getElementById('cashfree-script')) {
      const script = document.createElement('script');
      script.id = 'cashfree-script';
      script.src = 'https://sdk.cashfree.com/js/ui/2.0.0/cashfree.prod.js'; // Production
      script.async = true;
      script.onload = () => setDirectCheckoutReady(true);
      document.body.appendChild(script);
    } else if (window.Cashfree) {
      setDirectCheckoutReady(true);
    }
    
    return () => {
      // Cleanup if component unmounts during payment process
      if (orderDetails && orderDetails.payment_session_id) {
        console.log('Cleaning up payment process');
      }
    };
  }, [orderDetails]);

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      
      // Call the API to create an order
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 1, // 1 rupee payment
        }),
      });
      
      const data = await response.json();
      
      // Store order details for potential Direct Checkout
      setOrderDetails(data);
      
      // Log the response
      console.log('Payment data received:', data);
      
      if (!response.ok) {
        console.error('Payment API error:', data);
        throw new Error(data.error || 'Failed to create order');
      }
      
      // Prioritize payment_link (most reliable method)
      if (data.payment_link) {
        window.location.href = data.payment_link;
        return;
      }
      
      // Fallback to Direct Checkout integration if payment_session_id exists and SDK is loaded
      if (data.payment_session_id && directCheckoutReady && window.Cashfree) {
        try {
          const cashfree = new window.Cashfree(data.payment_session_id);
          cashfree.redirect(); // This handles the redirect more reliably
          return;
        } catch (directError) {
          console.error('Direct checkout error:', directError);
          // Continue to session ID fallback if direct checkout fails
        }
      }
      
      // Last resort: session_id URL redirect 
      if (data.payment_session_id) {
        window.location.href = `https://payments.cashfree.com/order/#${data.payment_session_id}`;
        return;
      }
      
      // If all methods fail
      throw new Error('Payment gateway error: Required payment data missing');
      
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment initialization failed. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>Make a Payment</CardTitle>
        <CardDescription>Simple ₹1 payment using Cashfree</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="p-4 text-center">
          <p className="text-2xl font-bold">₹1</p>
          <p className="text-sm text-gray-500 mt-2">One-time payment</p>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full"
          onClick={handlePayment}
          disabled={isLoading}
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing</>
          ) : (
            'Pay Now'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 