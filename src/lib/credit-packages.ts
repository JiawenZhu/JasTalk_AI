// Credit packages configuration (legacy - kept for backward compatibility)
export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Package',
    credits: 100, // $12.00 worth of credits
    price: 12.00,
    description: '100 minutes of interview practice',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro Package',
    credits: 167, // $20.00 worth of credits
    price: 20.00,
    description: '167 minutes of interview practice',
    popular: true,
  },
  {
    id: 'advanced',
    name: 'Advanced Package',
    credits: 200, // $24.00 worth of credits
    price: 24.00,
    description: '200 minutes of interview practice',
    popular: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise Package',
    credits: 400, // $48.00 worth of credits
    price: 48.00,
    description: '400 minutes of interview practice',
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium Package',
    credits: 833, // $100.00 worth of credits
    price: 100.00,
    description: '833 minutes of interview practice',
    popular: false,
  },
];

// New simplified credit packs (matching the premium page)
// 🎯 Minutes = Full Access to All Features (No tier restrictions)
export const SIMPLIFIED_CREDIT_PACKS = {
  'starter-pack': {
    id: 'starter-pack',
    name: 'Starter Pack',
    price: 15,
    interviews: 5,
    minutesPerInterview: 30,
    totalMinutes: 150,
    description: 'Perfect for last-minute practice - Full access to all features',
    minutes: 150, // 5 interviews × 30 minutes each
    features: ['All 20+ Premium AI Voices', 'Detailed Performance Analysis', 'Full Interview Logs']
  },
  'pro-pack': {
    id: 'pro-pack',
    name: 'Pro Pack',
    price: 40,
    interviews: 15,
    minutesPerInterview: 45,
    totalMinutes: 675,
    description: 'Best value for ongoing practice - Full access to all features',
    minutes: 675, // 15 interviews × 45 minutes each
    features: ['All 20+ Premium AI Voices', 'Detailed Performance Analysis', 'Full Interview Logs', 'Priority Support']
  }
};

// Note: Credits are now purely minutes-based
// No more dollar conversion - users buy minutes directly
