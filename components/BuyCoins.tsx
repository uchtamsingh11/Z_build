'use client';

// This component is used to buy coins from the user

import { useState } from 'react';
import { Coins, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function BuyCoins() {
  const [isLoading, setIsLoading] = useState(false);
  const [processingPaymentFor, setProcessingPaymentFor] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (amount: number, coins: number) => {
    try {
      setIsLoading(true);
      setProcessingPaymentFor(coins);
      setError(null);
      
      // Call our API to create an order
      console.log('Creating payment order:', { amount, coins });
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          coins: coins
        }),
      });
      
      const data = await response.json();
      
      // Log the response
      console.log('Payment data received:', data);
      
      if (!response.ok) {
        console.error('Payment API error:', data);
        setError(data.error || 'Failed to create order');
        return;
      }
      
      // Check if we have the required data to proceed
      if (!data.payment_session_id && !data.payment_link) {
        console.error('Missing payment data:', data);
        setError('Payment gateway error: Required payment data missing');
        return;
      }
      
      // Redirect to the payment page - handle different Cashfree environments
      if (data.payment_link) {
        console.log('Redirecting to payment link:', data.payment_link);
        window.location.href = data.payment_link;
      } else if (data.payment_session_id) {
        // Dynamically construct the URL based on environment
        const isSandbox = window.location.hostname === 'localhost' || 
                        window.location.hostname.includes('vercel.app');
        const paymentBaseUrl = isSandbox 
          ? 'https://sandbox.cashfree.com/pg'
          : 'https://payments.cashfree.com/order';
          
        const paymentUrl = `${paymentBaseUrl}/#${data.payment_session_id}`;
        console.log('Redirecting to payment session:', paymentUrl);
        window.location.href = paymentUrl;
      } else {
        setError('No payment redirect information available');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment initialization failed. Please try again later.');
    } finally {
      setIsLoading(false);
      setProcessingPaymentFor(null);
    }
  };

  return (
    <div id="buy-section" className="mt-12">
      <h2 className="text-xl font-semibold mb-6">Buy Coins</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Plan */}
        <Card className="shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="mb-2 flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <Coins className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle>Basic</CardTitle>
            </div>
            
            <div className="flex items-baseline mb-2">
              <span className="text-3xl font-bold">₹999</span>
              <span className="ml-1 text-sm text-gray-500">/one-time</span>
            </div>
            
            <CardDescription className="flex items-center text-lg font-semibold text-gray-700">
              <Coins className="h-4 w-4 mr-2 text-yellow-500" />
              1000 Coins
            </CardDescription>
          </CardHeader>
          
          <CardFooter>
            <Button 
              className="w-full"
              onClick={() => handlePurchase(999, 1000)}
              disabled={isLoading}
            >
              {isLoading && processingPaymentFor === 1000 ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing</>
              ) : (
                'Buy Now'
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="shadow-lg hover:shadow-xl transition-all border-blue-200">
          <CardHeader className="pb-3">
            <div className="mb-2 flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <Coins className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle>Pro</CardTitle>
                <CardDescription className="text-xs">Best value</CardDescription>
              </div>
            </div>
            
            <div className="flex items-baseline mb-2">
              <span className="text-3xl font-bold">₹2249</span>
              <span className="ml-1 text-sm text-gray-500">/one-time</span>
            </div>
            
            <CardDescription className="flex items-center text-lg font-semibold text-gray-700">
              <Coins className="h-4 w-4 mr-2 text-yellow-500" />
              2500 Coins
            </CardDescription>
          </CardHeader>
          
          <CardFooter>
            <Button 
              className="w-full"
              onClick={() => handlePurchase(2249, 2500)}
              disabled={isLoading}
              variant="default"
            >
              {isLoading && processingPaymentFor === 2500 ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing</>
              ) : (
                'Buy Now'
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Custom Plan */}
        <Card className="shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="mb-2 flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <Coins className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle>Custom</CardTitle>
            </div>
            
            <div className="text-center py-2">
              <div className="flex items-center justify-center mb-2">
                <span className="text-2xl font-bold">500</span>
                <Coins className="h-5 w-5 ml-2 text-yellow-500" />
              </div>
              
              <div className="text-xl font-semibold">₹500</div>
              <p className="text-xs text-gray-500 mt-1">₹1 = 1 Coin</p>
            </div>
          </CardHeader>
          
          <CardFooter>
            <Button 
              className="w-full"
              onClick={() => handlePurchase(500, 500)}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading && processingPaymentFor === 500 ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing</>
              ) : (
                'Buy Now'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>All purchases are final and non-refundable once coins are credited to your account. Unused coins remain valid for 12 months from the date of purchase.</p>
      </div>
    </div>
  );
} 