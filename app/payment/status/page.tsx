'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, RefreshCw, Coins } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Client component that uses useSearchParams
function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams?.get('orderId') || null;
  const amount = searchParams?.get('amount') || null;
  const coins = searchParams?.get('coins') || null;
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [coinsAdded, setCoinsAdded] = useState(false);
  const [coinsAmount, setCoinsAmount] = useState(0);

  // Function to check payment status with retries
  const checkPaymentStatus = async (isManualRetry = false) => {
    try {
      if (isManualRetry) {
        setIsLoading(true);
        setError(null);
      }
      
      console.log(`Checking payment status for order ${orderId}, attempt ${verificationAttempts + 1}`);
      
      const response = await fetch(`/api/payment/verify?orderId=${orderId}&_t=${Date.now()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify payment');
      }

      setOrderDetails(data.order || null);
      setStatus(data.status);
      setCoinsAdded(data.coins_added || false);
      
      if (data.coins_amount) {
        setCoinsAmount(data.coins_amount);
      } else if (coins) {
        setCoinsAmount(parseInt(coins));
      }
      
      // If the status is still PENDING and we've made fewer than 3 automatic checks,
      // schedule another verification attempt after a short delay
      if (data.status === 'PENDING' && verificationAttempts < 3 && !isManualRetry) {
        setVerificationAttempts(prev => prev + 1);
        setTimeout(() => checkPaymentStatus(), 3000); // Check again after 3 seconds
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setError('Failed to verify payment status. Please try again or contact support.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      setError('Order ID is missing');
      setIsLoading(false);
      return;
    }

    checkPaymentStatus();
  }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };
  
  const handleViewCoins = () => {
    router.push('/dashboard/coins');
  };
  
  const handleRetryVerification = () => {
    checkPaymentStatus(true);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
      <h1 className="text-2xl font-bold mb-6">Payment Status</h1>

      {isLoading ? (
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600">
            {verificationAttempts > 0 
              ? `Verifying payment status (attempt ${verificationAttempts + 1})...` 
              : 'Verifying payment status...'}
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center">
          <XCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex space-x-4">
            <Button 
              onClick={handleRetryVerification}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Check Again
            </Button>
            <Button 
              onClick={handleBackToDashboard}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      ) : status === 'COMPLETED' ? (
        <div className="flex flex-col items-center">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <p className="text-green-600 text-lg font-semibold mb-2">Payment Successful!</p>
          
          {coinsAdded ? (
            <div className="mb-6">
              <div className="flex items-center justify-center mb-2">
                <Coins className="h-6 w-6 text-amber-500 mr-2" />
                <p className="text-gray-800 font-semibold">{coinsAmount} coins added to your account</p>
              </div>
              <p className="text-gray-600">Your coins are ready to use</p>
            </div>
          ) : (
            <p className="text-gray-600 mb-6">Your payment has been processed successfully.</p>
          )}
          
          <div className="flex space-x-4">
            {coinsAdded && (
              <Button 
                onClick={handleViewCoins}
                className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition flex items-center"
              >
                <Coins className="h-4 w-4 mr-2" /> View My Coins
              </Button>
            )}
            <Button 
              onClick={handleBackToDashboard}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      ) : status === 'PENDING' ? (
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-yellow-500 mb-4" />
          <p className="text-yellow-600 text-lg font-semibold mb-2">Payment Processing</p>
          <p className="text-gray-600 mb-6">Your payment is being processed. This may take a moment.</p>
          <div className="flex space-x-4">
            <Button 
              onClick={handleRetryVerification}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Check Again
            </Button>
            <Button 
              onClick={handleBackToDashboard}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <XCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600 text-lg font-semibold mb-2">Payment Failed</p>
          <p className="text-gray-600 mb-6">Your payment could not be processed.</p>
          <div className="flex space-x-4">
            <Button 
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      )}

      {orderId && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500">Order ID: {orderId}</p>
          {amount && <p className="text-sm text-gray-500 mt-1">Amount: ₹{amount}</p>}
          {coins && <p className="text-sm text-gray-500 mt-1">Coins: {coins}</p>}
          {orderDetails?.payment_session_id && (
            <p className="text-sm text-gray-500 mt-1">Session ID: {orderDetails.payment_session_id.substring(0, 12)}...</p>
          )}
        </div>
      )}
    </div>
  );
}

// Main page component with Suspense boundary
export default function PaymentStatusPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense fallback={<div className="flex items-center justify-center"><Loader2 className="h-12 w-12 text-blue-500 animate-spin" /></div>}>
        <PaymentStatusContent />
      </Suspense>
    </div>
  );
} 