'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

interface CoinPackage {
  id: number;
  coins: number;
  price: number;
  popular?: boolean;
}

const coinPackages: CoinPackage[] = [
  { id: 1, coins: 100, price: 99 },
  { id: 2, coins: 500, price: 449, popular: true },
  { id: 3, coins: 1000, price: 849 },
  { id: 4, coins: 5000, price: 3999 }
];

export default function BuyCoins() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>('');
  const [isLoading, setIsLoading] = useState<number | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setEmail(user.email || null);
        
        // Fetch user profile for phone number if available
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', user.id)
          .single();
          
        if (profile?.phone) {
          setPhone(profile.phone);
        }
      }
    };
    
    getUser();
  }, [supabase]);

  const initiateCashfreePayment = async (coinPackage: CoinPackage) => {
    try {
      if (!userId) {
        // Redirect to login if user not authenticated
        router.push('/auth/login');
        return;
      }
      
      setIsLoading(coinPackage.id);
      
      // Call our API to create a payment order
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          coinAmount: coinPackage.coins,
          price: coinPackage.price,
          customerEmail: email,
          customerPhone: phone
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        console.error('Failed to create payment order:', data.message);
        alert('Failed to initiate payment. Please try again.');
        setIsLoading(null);
        return;
      }
      
      // Load Cashfree SDK
      const cashfree = await loadCashfreeSDK();
      
      // Initiate payment
      cashfree.checkout({
        paymentSessionId: data.data.payment_session_id,
        redirectTarget: '_self'
      });
      
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('An error occurred while initiating payment. Please try again.');
      setIsLoading(null);
    }
  };
  
  // Function to load Cashfree SDK
  const loadCashfreeSDK = async () => {
    return new Promise<any>((resolve, reject) => {
      // Check if already loaded
      if ((window as any).Cashfree) {
        resolve((window as any).Cashfree);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/ui/2.0.0/cashfree.prod.js';
      script.async = true;
      
      script.onload = () => {
        // Initialize Cashfree
        const cashfree = new (window as any).Cashfree();
        resolve(cashfree);
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Cashfree SDK'));
      };
      
      document.body.appendChild(script);
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Purchase Coins</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {coinPackages.map((pkg) => (
          <div 
            key={pkg.id} 
            className={`border rounded-lg p-4 text-center transition-all ${
              pkg.popular ? 'border-blue-500 border-2 relative' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {pkg.popular && (
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs py-1 px-2 rounded-full">
                Popular
              </span>
            )}
            
            <div className="text-3xl font-bold mb-2">{pkg.coins}</div>
            <div className="text-gray-600 mb-3">Coins</div>
            <div className="text-2xl font-semibold mb-4">₹{pkg.price}</div>
            
            <button
              onClick={() => initiateCashfreePayment(pkg)}
              disabled={isLoading === pkg.id}
              className={`w-full py-2 px-4 rounded-md ${
                isLoading === pkg.id
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLoading === pkg.id ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing
                </span>
              ) : (
                'Buy Now'
              )}
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Payments are securely processed by Cashfree.</p>
        <p className="mt-1">By purchasing coins, you agree to our <a href="/terms" className="text-blue-600 hover:underline">Terms and Conditions</a>.</p>
      </div>
    </div>
  );
} 