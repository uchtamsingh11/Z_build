'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

function PaymentStatusContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState<string>('Verifying payment status...');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  useEffect(() => {
    const orderId = searchParams?.get('order_id');
    
    if (!orderId) {
      setStatus('failed');
      setMessage('Invalid payment information');
      return;
    }
    
    const verifyPayment = async () => {
      try {
        // First check the database directly
        const { data: orderData, error } = await supabase
          .from('coin_orders')
          .select('*')
          .eq('order_id', orderId)
          .single();
          
        if (error) {
          console.error('Error fetching order:', error);
          setStatus('failed');
          setMessage('Could not verify payment status. Please contact support.');
          return;
        }

        // If order exists, check its status
        if (orderData) {
          setOrderDetails(orderData);
          
          if (orderData.status === 'COMPLETED') {
            setStatus('success');
            setMessage('Payment successful! Your coins have been added to your account.');
            return;
          } else if (orderData.status === 'FAILED') {
            setStatus('failed');
            setMessage('Payment failed or was cancelled. Please try again.');
            return;
          }
        }
        
        // If order is still pending, verify with the payment gateway via our API
        const verifyResponse = await fetch(`/api/payment/verify?orderId=${orderId}`);
        const verifyData = await verifyResponse.json();
        
        if (!verifyResponse.ok) {
          console.error('Error verifying payment:', verifyData);
          setStatus('failed');
          setMessage('Could not verify payment status. Please contact support.');
          return;
        }
        
        setOrderDetails(verifyData);
        
        if (verifyData.status === 'COMPLETED') {
          setStatus('success');
          setMessage('Payment successful! Your coins have been added to your account.');
        } else if (verifyData.status === 'FAILED') {
          setStatus('failed');
          setMessage('Payment failed or was cancelled. Please try again.');
        } else {
          // If still pending, check again after a short delay
          setTimeout(verifyPayment, 3000);
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
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-black text-white">
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold font-mono">
          {status === 'loading' ? 'PROCESSING_PAYMENT'
            : status === 'success' ? 'PAYMENT_SUCCESS'
            : 'PAYMENT_FAILED'}
        </h1>
        
        <div className="mb-6 text-center">
          {status === 'loading' ? (
            <div className="flex justify-center">
              <Loader2 className="h-16 w-16 animate-spin text-white" />
            </div>
          ) : status === 'success' ? (
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-800">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          ) : (
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-800">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
          )}
          
          <p className="text-zinc-300 mt-4">{message}</p>
          
          {status === 'success' && orderDetails && (
            <div className="mt-6 p-4 bg-zinc-800 rounded-lg text-left">
              <p className="text-zinc-300 text-sm">
                <span className="font-semibold">Order ID:</span> {orderDetails.orderId}
              </p>
              <p className="text-zinc-300 text-sm mt-1">
                <span className="font-semibold">Amount:</span> ₹{orderDetails.amount}
              </p>
              <p className="text-zinc-300 text-sm mt-1">
                <span className="font-semibold">Coins Added:</span> {orderDetails.coinAmount}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-center">
          {status !== 'loading' && (
            <button
              onClick={handleRedirect}
              className="rounded-md bg-zinc-800 px-6 py-2 text-white font-mono border border-zinc-700 hover:bg-zinc-700 transition-all duration-200"
            >
              {status === 'success' ? 'BACK_TO_DASHBOARD' : 'TRY_AGAIN'}
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
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-black text-white">
        <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-8 shadow-md">
          <h1 className="mb-6 text-center text-2xl font-bold font-mono">LOADING</h1>
          <div className="flex justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-white" />
          </div>
        </div>
      </div>
    }>
      <PaymentStatusContent />
    </Suspense>
  );
} 