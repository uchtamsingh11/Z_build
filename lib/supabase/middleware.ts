import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Check for protected admin routes
  if (isAdminRoute(request.nextUrl.pathname)) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // If not logged in, redirect to login
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    // Check if user is an admin
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (error || !userData || userData.role !== 'admin') {
      // If not an admin, redirect to unauthorized page or home
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  await supabase.auth.getUser()
  return response
}

// Function to determine if a route requires admin access
function isAdminRoute(pathname: string): boolean {
  const adminRoutes = [
    '/dashboard/create-strategy',
    '/dashboard/edit-strategy',
    '/dashboard/upload-strategy',
    '/api/strategies/create',
    '/api/strategies/update',
    '/api/strategies/delete'
  ];
  
  return adminRoutes.some(route => pathname.startsWith(route));
} 