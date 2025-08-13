// Credit packages configuration
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

// Convert dollars to minutes (based on $0.12/minute rate)
export const dollarsToMinutes = (dollars: number): number => {
  return Math.round((dollars / 0.12) * 100) / 100;
};

// Convert minutes to dollars
export const minutesToDollars = (minutes: number): number => {
  return Math.round(minutes * 0.12 * 100) / 100;
};
