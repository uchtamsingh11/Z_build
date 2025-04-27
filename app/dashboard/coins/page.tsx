import { Metadata } from 'next';
// import BuyCoins from '@/components/BuyCoins';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import CoinsHeader from '@/components/CoinsHeader';

export const metadata: Metadata = {
  title: 'Buy Coins - Trading Platform',
  description: 'Purchase coins to use in our algorithmic trading platform',
};

export default async function CoinsPage() {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <h1 className="text-2xl font-bold mb-4">Please log in to view your coins</h1>
        <a href="/auth/login" className="text-blue-600 hover:underline">Log in</a>
      </div>
    );
  }
  
  // Fetch user's coin balance
  const { data: userCoins } = await supabase
    .from('users')
    .select('coin_balance')
    .eq('id', user.id)
    .single();
    
  const coinBalance = userCoins?.coin_balance || 0;
  
  // Fetch recent coin transactions
  const { data: transactions } = await supabase
    .from('coin_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <CoinsHeader coinBalance={coinBalance} />
      
      {/* <BuyCoins /> */}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        
        {(!transactions || transactions.length === 0) ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">You don't have any coin transactions yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.type === 'credit' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'credit' ? 'Added' : 'Used'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.type === 'credit' ? '+' : '-'}{transaction.amount} coins
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 