import { NextRequest, NextResponse } from 'next/server';
import { stripe, getWebhookSecret } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase';
import { CREDIT_PACKAGES } from '@/lib/credit-packages';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('Webhook: Missing signature');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, getWebhookSecret());
    console.log('Webhook: Event received:', event.type);
  } catch (err) {
    console.error('Webhook: Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Webhook: Processing checkout.session.completed for session:', session.id);
    
    try {
      // Use admin client with service role key to bypass RLS
      const supabase = createAdminClient();
      
      // Extract metadata from session and line items
      let userId, packageId, credits, amount, stripeMode;
      
      console.log('Webhook: Session metadata:', session.metadata);
      console.log('Webhook: Session line_items:', session.line_items);
      
      // Try to get metadata from session first
      if (session.metadata) {
        userId = session.metadata.userId;
        packageId = session.metadata.packageId;
        credits = session.metadata.credits;
        amount = session.metadata.amount;
        stripeMode = session.metadata.stripeMode;
        
        console.log('Webhook: Extracted from session metadata:', {
          userId, packageId, credits, amount, stripeMode
        });
      }
      
      // If not found in session metadata, try to get from line items
      if (!userId || !packageId || !credits) {
        console.log('Webhook: Trying to extract from line items...');
        if (session.line_items && session.line_items.data && session.line_items.data.length > 0) {
          const lineItem = session.line_items.data[0];
          console.log('Webhook: Line item:', lineItem);
          
          if (lineItem.price && lineItem.price.product && typeof lineItem.price.product === 'object' && 'metadata' in lineItem.price.product) {
            const productMetadata = lineItem.price.product.metadata;
            console.log('Webhook: Product metadata:', productMetadata);
            
            userId = userId || productMetadata.userId;
            packageId = packageId || productMetadata.packageId;
            credits = credits || productMetadata.credits;
            
            console.log('Webhook: Extracted from product metadata:', {
              userId, packageId, credits
            });
          }
        }
      }
      
      // If still no metadata, try to get from the session object directly
      if (!userId || !packageId || !credits) {
        console.error('Webhook: Missing metadata in session:', {
          sessionMetadata: session.metadata,
          lineItems: session.line_items,
          session: session
        });
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      // Find the package
      const packageInfo = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
      if (!packageInfo) {
        console.error('Webhook: Invalid package ID:', packageId);
        return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
      }

      console.log(`Webhook: Processing payment for user ${userId}: ${credits} credits for $${amount}`);

      // Try to get current subscription
      let currentSubscription = null;
      try {
        console.log('Webhook: Checking for existing subscription...');
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        if (!error && data) {
          currentSubscription = data;
          console.log(`Webhook: Found existing subscription for user ${userId}:`, {
            currentCredits: data.interview_time_remaining,
            totalCredits: data.interview_time_total
          });
        } else {
          console.log('Webhook: No existing subscription found, will create new one');
        }
      } catch (fetchError) {
        console.log('Webhook: Error checking existing subscription:', fetchError);
      }

      if (currentSubscription) {
        // Update existing subscription
        const newCredits = currentSubscription.interview_time_remaining + parseInt(credits);
        const newTotal = currentSubscription.interview_time_total + parseInt(credits);
        
        console.log(`Webhook: Updating subscription for user ${userId}:`, {
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
          console.error('Webhook: Error updating subscription:', updateError);
          return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
        }
      } else {
        // Create new subscription
        console.log(`Webhook: Creating new subscription for user ${userId}:`, {
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
          console.error('Webhook: Error creating subscription:', createError);
          return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
        }
      }

      console.log(`Webhook: ✅ Successfully added ${credits} credits to user ${userId}`);
      
      // Log the final state for debugging
      try {
        const { data: finalSubscription } = await supabase
          .from('user_subscriptions')
          .select('interview_time_remaining, interview_time_total, leftover_seconds')
          .eq('user_id', userId)
          .single();
          
        if (finalSubscription) {
          console.log(`Webhook: Final subscription state for user ${userId}:`, {
            remainingCredits: finalSubscription.interview_time_remaining,
            totalCredits: finalSubscription.interview_time_total,
            leftoverSeconds: finalSubscription.leftover_seconds
          });
        }
      } catch (logError) {
        console.log('Webhook: Error logging final state:', logError);
      }

      // Create invoice for the purchase
      if (session.customer) {
        try {
          console.log('Webhook: Creating invoice...');
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
              console.error('Webhook: Error storing invoice in database:', invoiceStoreError);
            } else {
              console.log(`Webhook: 💾 Invoice stored in database for user ${userId}`);
            }
          } catch (dbError) {
            console.error('Webhook: Error storing invoice in database:', dbError);
          }
          
          console.log(`Webhook: 📧 Invoice created and sent for user ${userId}:`, {
            invoiceId: invoice.id,
            amount: amount,
            package: packageInfo.name
          });
        } catch (invoiceError) {
          console.error('Webhook: Error creating invoice:', invoiceError);
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
      console.error('Webhook: Error processing webhook:', error);
      console.error('Webhook: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        error: error
      });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
