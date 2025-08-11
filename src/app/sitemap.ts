import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://jastalk.ai'
  const now = new Date()
  const pages = [
    '',
    '/jastalk-landing',
    '/practice/new',
    '/seo/mock-interview-questions',
    '/seo/phone-screen-practice',
  ]
  return pages.map((p) => ({ url: `${base}${p}`, lastModified: now, changeFrequency: 'weekly', priority: p === '' ? 1 : 0.6 }))
}


