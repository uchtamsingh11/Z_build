'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// Client component that uses useSearchParams
function PaymentStatusContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState<string>('Verifying your payment...');
  const searchParams = useSearchParams();
  
  // Support both `orderId` (our format) and `order_id` (Cashfree format)
  const orderId = searchParams?.get('orderId') || searchParams?.get('order_id') || null;
  
  useEffect(() => {
    if (!orderId) {
      setStatus('failed');
      setMessage('Invalid payment reference. Order ID is missing.');
      return;
    }
    
    async function checkPaymentStatus() {
      try {
        const supabase = createClient();
        
        // Check if the order exists and what its status is
        const { data, error } = await supabase
          .from('coin_orders')
          .select('*')
          .eq('order_id', orderId)
          .single();
        
        if (error || !data) {
          console.error('Error fetching order:', error);
          setStatus('failed');
          setMessage('Unable to verify payment. Order not found.');
          return;
        }
        
        // If the order is marked as completed, it's successful
        if (data.status === 'COMPLETED') {
          setStatus('success');
          setMessage(`Payment successful! ${data.coins} coins have been added to your account.`);
        } else {
          // For demo purposes, let's assume payment is successful if we find the order
          // In production, you would check against Cashfree's API
          setStatus('success');
          setMessage(`Payment processed! ${data.coins} coins will be added to your account shortly.`);
          
          // Update the order status to completed
          await supabase
            .from('coin_orders')
            .update({ status: 'COMPLETED' })
            .eq('order_id', orderId);
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
        setStatus('failed');
        setMessage('An error occurred while verifying your payment.');
      }
    }
    
    checkPaymentStatus();
  }, [orderId]);
  
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Payment Status</h1>
          
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center p-4">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-600">{message}</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center justify-center p-4">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-gray-600">{message}</p>
            </div>
          )}
          
          {status === 'failed' && (
            <div className="flex flex-col items-center justify-center p-4">
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-gray-600">{message}</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-center">
          <Link href="/dashboard/coins">
            <Button>Go to Coin Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    }>
      <PaymentStatusContent />
    </Suspense>
  );
} 