import { NextRequest, NextResponse } from 'next/server';
import { getStripeConfig } from '@/lib/stripe';
import { SIMPLIFIED_CREDIT_PACKS, CREDIT_PACKAGES } from '@/lib/credit-packages';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Test endpoint not available in production' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { packageId, testUserId = 'test-user-123' } = body;

    if (!packageId) {
      return NextResponse.json(
        { error: 'packageId is required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing checkout metadata for package:', packageId);

    // Check if it's a new simplified pack or legacy pack
    let selectedPackage;
    
    if (SIMPLIFIED_CREDIT_PACKS[packageId as keyof typeof SIMPLIFIED_CREDIT_PACKS]) {
      selectedPackage = SIMPLIFIED_CREDIT_PACKS[packageId as keyof typeof SIMPLIFIED_CREDIT_PACKS];
    } else {
      // Fallback to legacy packages for backward compatibility
      selectedPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
    }
    
    if (!selectedPackage) {
      return NextResponse.json(
        { error: 'Invalid package selected' },
        { status: 400 }
      );
    }

    // Helper function to get minutes from package (handles both new and legacy formats)
    const getPackageMinutes = (pkg: any): number => {
      if ('minutes' in pkg) return pkg.minutes;
      if ('credits' in pkg) return pkg.credits;
      return 0;
    };

    const packageMinutes = getPackageMinutes(selectedPackage);

    // Get the proper base URL from Stripe config
    const config = getStripeConfig();

    // Simulate the exact metadata that would be sent
    const sessionMetadata = {
      userId: testUserId,
      packageId: selectedPackage.id,
      minutes: packageMinutes.toString(),
      amount: selectedPackage.price.toString(),
      stripeMode: 'test',
    };

    const productMetadata = {
      packageId: selectedPackage.id,
      minutes: packageMinutes.toString(),
      userId: testUserId,
    };

    const invoiceMetadata = {
      userId: testUserId,
      packageId: selectedPackage.id,
      minutes: packageMinutes.toString(),
    };

    console.log('🧪 Generated metadata for checkout session:', {
      sessionMetadata,
      productMetadata,
      invoiceMetadata
    });

    return NextResponse.json({
      success: true,
      message: 'Checkout metadata test completed',
      package: {
        id: selectedPackage.id,
        name: selectedPackage.name,
        price: selectedPackage.price,
        minutes: packageMinutes,
        description: selectedPackage.description
      },
      metadata: {
        session: sessionMetadata,
        product: productMetadata,
        invoice: invoiceMetadata
      },
      config: {
        baseUrl: config.baseUrl,
        webhookEndpoint: `${config.baseUrl}/api/stripe/webhook`,
        stripeMode: 'test'
      },
      webhookTest: {
        expectedEvent: 'checkout.session.completed',
        requiredFields: ['userId', 'packageId', 'minutes', 'amount'],
        note: 'This metadata should be received by the webhook endpoint'
      }
    });

  } catch (error) {
    console.error('Error in test checkout metadata:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
