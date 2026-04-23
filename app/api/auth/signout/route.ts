import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST() {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options } as Parameters<typeof cookieStore.set>[0])
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value: '', ...options } as Parameters<typeof cookieStore.set>[0])
        },
      },
    }
  )

  await supabase.auth.signOut()

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  return NextResponse.redirect(new URL('/admin/login', base))
}
