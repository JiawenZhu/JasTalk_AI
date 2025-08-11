"use client";

import { useEffect, useState } from 'react'

type Props = {
  openAfterMs?: number
  headline?: string
  subhead?: string
  cta?: string
  onSubmitted?: () => void
}

export default function EmailCaptureModal({
  openAfterMs = 15000,
  headline = 'Get the Top 50 Interview Questions + Answers',
  subhead = 'Join our newsletter and receive a free PDF plus weekly interview tips.',
  cta = 'Get the free PDF',
  onSubmitted,
}: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const hasSeen = localStorage.getItem('lead_modal_seen')
    if (hasSeen) return
    const t = setTimeout(() => setOpen(true), openAfterMs)
    return () => clearTimeout(t)
  }, [openAfterMs])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'modal' }),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error || 'Failed to subscribe')
      }
      setSubmitted(true)
      localStorage.setItem('lead_modal_seen', '1')
      onSubmitted?.()
    } catch (err: any) {
      setError(err?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200">
        <div className="p-6">
          {submitted ? (
            <>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox!</h3>
              <p className="text-gray-600">We just sent the PDF and tips to {email}. Welcome aboard.</p>
              <button className="mt-6 w-full rounded-lg bg-blue-600 text-white py-3 font-semibold" onClick={() => setOpen(false)}>Close</button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-blue-600 mb-2 text-sm font-semibold">Free Resource</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{headline}</h3>
              <p className="text-gray-600 mb-4">{subhead}</p>
              <form onSubmit={onSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 font-semibold disabled:opacity-70"
                >
                  {loading ? 'Submitting…' : cta}
                </button>
              </form>
              <button className="mt-3 w-full text-sm text-gray-500" onClick={() => setOpen(false)}>No thanks</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


