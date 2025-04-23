'use client';

interface CoinsHeaderProps {
  coinBalance: number;
}

export default function CoinsHeader({ coinBalance }: CoinsHeaderProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold">Your Coin Balance</h1>
          <div className="mt-2 text-3xl font-bold text-blue-600">{coinBalance} coins</div>
          <p className="text-gray-500 mt-1">
            Use coins to activate trading bots and other premium features
          </p>
        </div>
        <div className="w-full md:w-auto">
          <a
            href="#buy-section"
            className="block w-full md:w-auto text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition"
          >
            Buy More Coins
          </a>
        </div>
      </div>
    </div>
  );
} 