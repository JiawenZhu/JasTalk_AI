import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      email?: string
      name?: string
      source?: string
    }

    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const supabase = createServerClient()

    const cookieStore = cookies()
    const ref = cookieStore.get('ref')?.value ?? null
    const utm_source = cookieStore.get('utm_source')?.value ?? null
    const utm_medium = cookieStore.get('utm_medium')?.value ?? null
    const utm_campaign = cookieStore.get('utm_campaign')?.value ?? null
    const utm_term = cookieStore.get('utm_term')?.value ?? null
    const utm_content = cookieStore.get('utm_content')?.value ?? null

    const { data, error } = await supabase
      .from('leads')
      .insert({
        email: body.email.toLowerCase(),
        name: body.name ?? null,
        source: body.source ?? 'modal',
        ref,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
      })
      .select('*')
      .single()

    if (error) {
      // Unique constraint or other
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, lead: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 })
  }
}


