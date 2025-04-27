'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { useNotification } from '@/lib/notification'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')
  const { showNotification } = useNotification()

  useEffect(() => {
    if (error) {
      let title = 'AUTHENTICATION_ERROR';
      let description = error;

      // Map common error codes to more user-friendly messages
      if (error.toLowerCase().includes('invalid_login')) {
        title = 'ACCESS_DENIED';
        description = 'Your login attempt was unsuccessful. Please check your credentials and try again.';
      } else if (error.toLowerCase().includes('email')) {
        title = 'EMAIL_ERROR';
        description = 'There was an issue with your email address. It may be invalid or already in use.';
      } else if (error.toLowerCase().includes('password')) {
        title = 'PASSWORD_ERROR';
        description = 'There was an issue with your password. Please ensure it meets the required criteria.';
      } else if (error.toLowerCase().includes('token')) {
        title = 'TOKEN_ERROR';
        description = 'Your authentication token is invalid or has expired. Please try logging in again.';
      } else if (error.toLowerCase().includes('session')) {
        title = 'SESSION_ERROR';
        description = 'Your session has expired or is invalid. Please sign in again to continue.';
      }

      showNotification({
        title,
        description,
        type: 'error',
        duration: 7000
      })
    } else {
      showNotification({
        title: 'SYSTEM_ERROR',
        description: 'An unexpected authentication error occurred. Our team has been notified.',
        type: 'error',
        duration: 5000
      })
    }
  }, [error, showNotification])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-black text-white font-mono relative">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="bg-zinc-950 border border-zinc-900">
            <CardHeader>
              <CardTitle className="text-xl font-mono tracking-wide">AUTHENTICATION ERROR</CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <p className="text-sm text-zinc-400 mb-4">Error code: {error}</p>
              ) : (
                <p className="text-sm text-zinc-400 mb-4">An unspecified error occurred during authentication.</p>
              )}
              <Link href="/auth/login">
                <Button variant="outline" className="bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-white w-full font-mono text-xs">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  RETURN_TO_LOGIN
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none -z-10" />
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-zinc-700 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
