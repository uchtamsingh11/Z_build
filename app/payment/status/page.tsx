'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('Order ID is missing');
      setIsLoading(false);
      return;
    }

    async function checkPaymentStatus() {
      try {
        const response = await fetch(`/api/payment/verify?orderId=${orderId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify payment');
        }

        setStatus(data.status);
      } catch (error) {
        console.error('Payment verification error:', error);
        setError('Failed to verify payment status. Please contact support.');
      } finally {
        setIsLoading(false);
      }
    }

    checkPaymentStatus();
  }, [orderId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-6">Payment Status</h1>

        {isLoading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600">Verifying payment status...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Link 
              href="/dashboard" 
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : status === 'COMPLETED' ? (
          <div className="flex flex-col items-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-green-600 text-lg font-semibold mb-2">Payment Successful!</p>
            <p className="text-gray-600 mb-6">Your coins have been added to your account.</p>
            <Link 
              href="/dashboard/coins" 
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            >
              View My Coins
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600 text-lg font-semibold mb-2">Payment Failed</p>
            <p className="text-gray-600 mb-6">Your payment could not be processed.</p>
            <div className="flex space-x-4">
              <Link 
                href="/pricing" 
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
              >
                Try Again
              </Link>
              <Link 
                href="/dashboard" 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}

        {orderId && (
          <p className="mt-6 text-sm text-gray-500">Order ID: {orderId}</p>
        )}
      </div>
    </div>
  );
} 