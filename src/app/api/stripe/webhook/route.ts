import { NextRequest, NextResponse } from 'next/server';
import { stripe, getWebhookSecret } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase';
import { CREDIT_PACKAGES } from '@/lib/credit-packages';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, getWebhookSecret());
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      // Use admin client in webhooks (no end-user session, needs RLS bypass)
      const supabase = createAdminClient();
      
      // Extract metadata from session and line items
      let userId, packageId, credits, amount, stripeMode;
      
      // Try to get metadata from session first
      if (session.metadata) {
        userId = session.metadata.userId;
        packageId = session.metadata.packageId;
        credits = session.metadata.credits;
        amount = session.metadata.amount;
        stripeMode = session.metadata.stripeMode;
      }
      
      // If not found in session metadata, try to get from line items
      if (!userId || !packageId || !credits) {
        if (session.line_items && session.line_items.data && session.line_items.data.length > 0) {
          const lineItem = session.line_items.data[0];
          if (lineItem.price && lineItem.price.product && typeof lineItem.price.product === 'object' && 'metadata' in lineItem.price.product) {
            const productMetadata = lineItem.price.product.metadata;
            userId = userId || productMetadata.userId;
            packageId = packageId || productMetadata.packageId;
            credits = credits || productMetadata.credits;
          }
        }
      }
      
      // If still no metadata, try to get from the session object directly
      if (!userId || !packageId || !credits) {
        console.error('Missing metadata in session:', {
          sessionMetadata: session.metadata,
          lineItems: session.line_items,
          session: session
        });
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      // Find the package
      const packageInfo = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
      if (!packageInfo) {
        console.error('Invalid package ID:', packageId);
        return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
      }

      console.log(`Processing payment for user ${userId}: ${credits} credits for $${amount}`);

      // Try to get current subscription
      let currentSubscription = null;
      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        if (!error && data) {
          currentSubscription = data;
          console.log(`Found existing subscription for user ${userId}:`, {
            currentCredits: data.interview_time_remaining,
            totalCredits: data.interview_time_total
          });
        }
      } catch (fetchError) {
        console.log('No existing subscription found, will create new one');
      }

      if (currentSubscription) {
        // Update existing subscription
        const newCredits = currentSubscription.interview_time_remaining + parseInt(credits);
        const newTotal = currentSubscription.interview_time_total + parseInt(credits);
        
        console.log(`Updating subscription for user ${userId}:`, {
          oldCredits: currentSubscription.interview_time_remaining,
          newCredits: newCredits,
          addedCredits: parseInt(credits)
        });

        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            interview_time_remaining: newCredits,
            interview_time_total: newTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentSubscription.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
        }
      } else {
        // Create new subscription
        console.log(`Creating new subscription for user ${userId}:`, {
          initialCredits: parseInt(credits),
          packageId: packageId
        });

        const { error: createError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            tier: 'pro',
            status: 'active',
            interview_time_remaining: parseInt(credits),
            interview_time_total: parseInt(credits),
          });

        if (createError) {
          console.error('Error creating subscription:', createError);
          return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
        }
      }

      console.log(`✅ Successfully added ${credits} credits to user ${userId}`);

      // Create invoice for the purchase
      if (session.customer) {
        try {
          const invoice = await stripe.invoices.create({
            customer: session.customer,
            collection_method: 'send_invoice',
            days_until_due: 30,
            metadata: {
              userId: userId,
              packageId: packageId,
              credits: credits,
              amount: amount,
              sessionId: session.id,
            },
            line_items: [
              {
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: packageInfo.name,
                    description: packageInfo.description,
                  },
                  unit_amount: Math.round(parseFloat(amount || '0') * 100), // Convert to cents
                },
                quantity: 1,
              },
            ],
          } as any);

          // Send the invoice to the customer
          await stripe.invoices.sendInvoice(invoice.id!);
          
          // Store invoice information in database
          try {
            const { error: invoiceStoreError } = await supabase
              .from('user_invoices')
              .insert({
                user_id: userId,
                stripe_invoice_id: invoice.id,
                package_id: packageId,
                package_name: packageInfo.name,
                credits: parseInt(credits),
                amount: parseFloat(amount || '0'),
                status: invoice.status,
                invoice_url: invoice.hosted_invoice_url,
                created_at: new Date().toISOString(),
              });

            if (invoiceStoreError) {
              console.error('Error storing invoice in database:', invoiceStoreError);
            } else {
              console.log(`💾 Invoice stored in database for user ${userId}`);
            }
          } catch (dbError) {
            console.error('Error storing invoice in database:', dbError);
          }
          
          console.log(`📧 Invoice created and sent for user ${userId}:`, {
            invoiceId: invoice.id,
            amount: amount,
            package: packageInfo.name
          });
        } catch (invoiceError) {
          console.error('Error creating invoice:', invoiceError);
          // Don't fail the webhook if invoice creation fails
          // The credits were already added successfully
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: `Added ${credits} credits to user ${userId}`,
        creditsAdded: parseInt(credits)
      });
      
    } catch (error) {
      console.error('Error processing webhook:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
