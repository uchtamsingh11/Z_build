'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

function PaymentStatusContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState<string>('Verifying payment status...');
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  useEffect(() => {
    const orderId = searchParams?.get('order_id');
    const orderToken = searchParams?.get('order_token');
    
    if (!orderId || !orderToken) {
      setStatus('failed');
      setMessage('Invalid payment information');
      return;
    }
    
    const verifyPayment = async () => {
      try {
        // Query our database for order status
        const { data: orderData, error } = await supabase
          .from('coin_orders')
          .select('status')
          .eq('order_id', orderId)
          .single();
          
        if (error || !orderData) {
          setStatus('failed');
          setMessage('Could not verify payment status. Please contact support.');
          return;
        }
        
        // Check the status of the order
        if (orderData.status === 'COMPLETED') {
          setStatus('success');
          setMessage('Payment successful! Your coins have been added to your account.');
        } else if (orderData.status === 'PENDING') {
          // If still pending, the webhook might not have processed yet
          // Wait briefly and check again
          setTimeout(verifyPayment, 3000);
          return;
        } else {
          setStatus('failed');
          setMessage('Payment failed or was cancelled. Please try again.');
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
        setStatus('failed');
        setMessage('An error occurred while verifying payment. Please contact support.');
      }
    };
    
    verifyPayment();
  }, [searchParams, supabase]);
  
  const handleRedirect = () => {
    router.push('/dashboard');
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">
          {status === 'loading' ? 'Processing Payment'
            : status === 'success' ? 'Payment Successful'
            : 'Payment Failed'}
        </h1>
        
        <div className="mb-6 text-center">
          {status === 'loading' ? (
            <div className="flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            </div>
          ) : status === 'success' ? (
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
              <svg className="h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          ) : (
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
              <svg className="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
          )}
          
          <p className="text-gray-700">{message}</p>
        </div>
        
        <div className="flex justify-center">
          {status !== 'loading' && (
            <button
              onClick={handleRedirect}
              className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentStatus() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-md">
          <h1 className="mb-6 text-center text-2xl font-bold">Loading...</h1>
          <div className="flex justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          </div>
        </div>
      </div>
    }>
      <PaymentStatusContent />
    </Suspense>
  );
} 