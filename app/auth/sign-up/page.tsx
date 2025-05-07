'use client'

import { SignUpForm } from '@/components/sign-up-form'
import { useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { useNotification } from '@/lib/notification'
import BackButton from '@/components/back-button'

function SignupContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')
  const { showNotification } = useNotification()

  useEffect(() => {
    if (error) {
      showNotification({
        title: 'Signup Error',
        description: error,
        type: 'error'
      })
    }
  }, [error, showNotification])

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white font-mono relative">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          {/* <BackButton /> */}
          <span className="text-xs tracking-widest uppercase text-zinc-400 ml-2">System: Sign Up</span>
        </div>
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl shadow-md p-6">
          <SignUpForm />
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
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
