import type { Metadata } from 'next'

type Params = { params: { slug: string } }

const contentMap: Record<string, { title: string; description: string; body: string }> = {
  'mock-interview-questions': {
    title: 'Top Mock Interview Questions and Answers',
    description: 'Practice the most common interview questions with example answers and tips.',
    body: 'Here are the top questions asked in behavioral and technical interviews, with frameworks like STAR and sample answers...'
  },
  'phone-screen-practice': {
    title: 'Phone Screen Practice: Scripts and Tips',
    description: 'Ace your next phone screen with realistic scripts and best practices.',
    body: 'Use these phone screen scripts to prepare concise, effective answers and avoid common pitfalls...'
  },
}

export async function generateStaticParams() {
  return Object.keys(contentMap).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const entry = contentMap[params.slug]
  if (!entry) return { title: 'Interview Prep — JasTalk AI' }
  return {
    title: `${entry.title} — JasTalk AI`,
    description: entry.description,
    openGraph: { title: `${entry.title} — JasTalk AI`, description: entry.description },
    twitter: { title: `${entry.title} — JasTalk AI`, description: entry.description },
  }
}

export default function SeoPage({ params }: Params) {
  const entry = contentMap[params.slug]
  if (!entry) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-3">Resource not found</h1>
        <p className="text-gray-600">Try our main practice flow instead.</p>
      </div>
    )
  }
  return (
    <article className="max-w-3xl mx-auto p-6 prose prose-blue">
      <h1>{entry.title}</h1>
      <p className="lead">{entry.description}</p>
      <p>{entry.body}</p>
      <div className="mt-8">
        <a href="/sign-up?offer=free-credit" className="inline-block rounded-lg bg-blue-600 text-white px-4 py-2 font-semibold">Start Free Practice</a>
      </div>
    </article>
  )
}


