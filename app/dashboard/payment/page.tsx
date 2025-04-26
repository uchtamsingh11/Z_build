import SimplePayment from '@/components/SimplePayment';

export default function PaymentPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Make a Payment</h1>
      <div className="max-w-md mx-auto">
        <SimplePayment />
      </div>
    </div>
  );
} 