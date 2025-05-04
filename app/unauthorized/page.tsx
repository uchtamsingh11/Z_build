import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-zinc-900 p-8 rounded-xl border border-zinc-800">
        <div className="flex items-center justify-center">
          <div className="h-16 w-16 bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-2 text-zinc-400">
            You don't have permission to access this page. Only admin users can access strategy management features.
          </p>
        </div>
        
        <div className="space-y-3 pt-4">
          <Button asChild className="w-full">
            <Link href="/marketplace">
              Return to Marketplace
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full border-zinc-800">
            <Link href="/dashboard">
              Go to Dashboard
            </Link>
          </Button>
          
          <div className="text-center text-xs text-zinc-500 pt-4">
            If you believe you should have access to this page, please contact the site administrator.
          </div>
        </div>
      </div>
    </div>
  );
} 