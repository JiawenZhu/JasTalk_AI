import { NextRequest, NextResponse } from 'next/server';
import { stripe, getWebhookSecret } from '@/lib/stripe';

import { CREDIT_PACKAGES, SIMPLIFIED_CREDIT_PACKS } from '@/lib/credit-packages';
import { emailService } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  console.log('🔔 Webhook: Request received at', new Date().toISOString());
  console.log('🔔 Webhook: Headers:', Object.fromEntries(request.headers.entries()));
  
  const body = await request.text();
  console.log('🔔 Webhook: Body length:', body.length);
  console.log('🔔 Webhook: Body preview:', body.substring(0, 200) + '...');
  
  const signature = request.headers.get('stripe-signature');
  console.log('🔔 Webhook: Signature present:', !!signature);

  if (!signature) {
    console.error('❌ Webhook: Missing signature');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;

  try {
    console.log('🔔 Webhook: Attempting to verify signature...');
    event = stripe.webhooks.constructEvent(body, signature, getWebhookSecret());
    console.log('✅ Webhook: Signature verified successfully');
    console.log('🔔 Webhook: Event received:', event.type);
  } catch (err) {
    console.error('❌ Webhook: Signature verification failed:', err);
    console.error('❌ Webhook: Error details:', {
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : 'No stack trace'
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Log all webhook events for debugging
  console.log('🔔 Webhook received event:', {
    type: event.type,
    id: event.id,
    timestamp: new Date().toISOString()
  });

  // Handle different webhook events
  if (event.type === 'checkout.session.completed') {
    // This handles one-time payments (credit purchases)
    console.log('🎯 Webhook: Processing one-time payment (checkout.session.completed)');
    const session = event.data.object;
    console.log('🎯 Webhook: Session ID:', session.id);
    console.log('🎯 Webhook: Session object:', JSON.stringify(session, null, 2));
    
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
        credits = session.metadata.minutes || session.metadata.credits; // Look for 'minutes' first, fallback to 'credits'
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
            credits = credits || productMetadata.minutes || productMetadata.credits; // Look for 'minutes' first, fallback to 'credits'
            
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
          session: session,
          sessionId: session.id,
          amount: session.amount_total,
          currency: session.currency
        });
        
        // Try to extract from line items as fallback
        if (session.line_items && session.line_items.data && session.line_items.data.length > 0) {
          const lineItem = session.line_items.data[0];
          console.log('Webhook: Line item details:', {
            price: lineItem.price,
            product: lineItem.price?.product,
            metadata: typeof lineItem.price?.product === 'object' && lineItem.price?.product && 'metadata' in lineItem.price.product ? lineItem.price.product.metadata : undefined
          });
        }
        
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      // Find the package (check simplified packs first, then legacy)
      let packageInfo = SIMPLIFIED_CREDIT_PACKS[packageId as keyof typeof SIMPLIFIED_CREDIT_PACKS];
      if (!packageInfo) {
        packageInfo = CREDIT_PACKAGES.find(pkg => pkg.id === packageId) as any;
      }
      
      if (!packageInfo) {
        console.error('Webhook: Invalid package ID:', packageId);
        return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
      }

      // Use minutes from package info
      const minutesToAdd = packageInfo.minutes || parseInt(credits);
      console.log(`Webhook: Processing payment for user ${userId}: ${minutesToAdd} minutes for $${amount}`);

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
          currentMinutes: data.interview_time_remaining,
          totalMinutes: data.interview_time_total
        });
        } else {
          console.log('Webhook: No existing subscription found, will create new one');
        }
      } catch (fetchError) {
        console.log('Webhook: Error checking existing subscription:', fetchError);
      }

      if (currentSubscription) {
        // Update existing subscription
        const newMinutes = currentSubscription.interview_time_remaining + minutesToAdd;
        const newTotal = currentSubscription.interview_time_total + minutesToAdd;
        
        console.log(`Webhook: Updating subscription for user ${userId}:`, {
          oldMinutes: currentSubscription.interview_time_remaining,
          newMinutes: newMinutes,
          addedMinutes: minutesToAdd
        });

        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            interview_time_remaining: newMinutes,
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
          initialMinutes: minutesToAdd,
          packageId: packageId
        });

        const { error: createError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            tier: 'pro',
            status: 'active',
            interview_time_remaining: minutesToAdd,
            interview_time_total: minutesToAdd,
          });

        if (createError) {
          console.error('Webhook: Error creating subscription:', createError);
          return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
        }
      }

      console.log(`Webhook: ✅ Successfully added ${minutesToAdd} minutes to user ${userId}`);
      
      // Log the final state for debugging
      try {
        const { data: finalSubscription } = await supabase
          .from('user_subscriptions')
          .select('interview_time_remaining, interview_time_total, leftover_seconds')
          .eq('user_id', userId)
          .single();
          
        if (finalSubscription) {
          console.log(`Webhook: Final subscription state for user ${userId}:`, {
            remainingMinutes: finalSubscription.interview_time_remaining,
            totalMinutes: finalSubscription.interview_time_total,
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

          // Get customer email from Stripe
          const customerResponse = await stripe.customers.retrieve(session.customer as string);
          const customer = customerResponse.deleted ? null : customerResponse;
          const customerEmail = customer?.email;
          
          if (customerEmail) {
            // Send invoice email via SendGrid
            try {
              const invoiceAmount = `$${(parseFloat(amount || '0')).toFixed(2)}`;
              await emailService.sendInvoiceEmail({
                to: customerEmail,
                username: customer?.name || 'Valued Customer',
                invoiceNumber: invoice.number || 'N/A',
                invoiceDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                amount: invoiceAmount,
                currency: 'USD',
                items: [{
                  description: packageInfo.description || packageInfo.name,
                  quantity: 1,
                  unitPrice: invoiceAmount,
                  amount: invoiceAmount
                }],
                subtotal: invoiceAmount,
                total: invoiceAmount,
                paymentStatus: 'paid' as const,
                transactionId: session.id,
                companyInfo: {
                  name: 'Jastalk.AI',
                  address: '123 AI Street',
                  city: 'San Francisco',
                  state: 'CA',
                  zip: '94105',
                  country: 'USA',
                  email: 'noreply@jastalk.com'
                },
                customerInfo: {
                  name: customer?.name || 'Valued Customer'
                },
                downloadUrl: invoice.hosted_invoice_url || ''
              });
              console.log(`Webhook: 📧 Invoice email sent via SendGrid to ${customerEmail}`);
            } catch (emailError) {
              console.error('Webhook: Error sending invoice email via SendGrid:', emailError);
              // Fallback to Stripe's built-in email
              await stripe.invoices.sendInvoice(invoice.id!);
              console.log(`Webhook: 📧 Invoice sent via Stripe fallback to ${customerEmail}`);
            }
          } else {
            // Fallback to Stripe's built-in email if no customer email
            await stripe.invoices.sendInvoice(invoice.id!);
            console.log('Webhook: 📧 Invoice sent via Stripe (no customer email found)');
          }
          
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
  // Handle subscription creation
  else if (event.type === 'customer.subscription.created') {
    console.log('Webhook: Processing subscription creation (customer.subscription.created)');
    const subscription = event.data.object;
    console.log('Webhook: Processing customer.subscription.created for subscription:', subscription.id);
    
    try {
      const supabase = createAdminClient();
      
      // Extract user ID from subscription metadata
      const userId = subscription.metadata.userId;
      if (!userId) {
        console.error('Webhook: Missing userId in subscription metadata');
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
      }
      
      // Determine minutes based on subscription tier
      let monthlyMinutes = 480; // Default: 8 hours = 480 minutes for Monthly Credits
      if (subscription.metadata.tier === 'enterprise') {
        monthlyMinutes = 960; // 16 hours = 960 minutes for Enterprise
      } else if (subscription.metadata.tier === 'basic') {
        monthlyMinutes = 60; // 1 hour = 60 minutes for Basic
      } else if (subscription.metadata.tier === 'monthly-credits') {
        monthlyMinutes = 480; // 8 hours = 480 minutes for Monthly Credits Plan
      }
      
      console.log(`Webhook: Processing subscription for user ${userId}: ${monthlyMinutes} minutes`);
      
      // Check if subscription already exists for this user
      const { data: existingSubscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('tier', 'pro')
        .single();
      
      if (existingSubscription) {
        // Update existing subscription
        console.log(`Webhook: Updating existing subscription for user ${userId}`);
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'active',
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer,
            interview_time_remaining: monthlyMinutes,
            interview_time_total: monthlyMinutes,
            current_period_start: (subscription as any).current_period_start ? new Date((subscription as any).current_period_start * 1000).toISOString() : new Date().toISOString(),
            current_period_end: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id);
          
        if (updateError) {
          console.error('Webhook: Error updating subscription:', updateError);
          return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
        }
        
        console.log(`Webhook: ✅ Successfully updated subscription for user ${userId}`);
      } else {
        // Create new subscription record
        console.log(`Webhook: Creating new subscription for user ${userId}`);
        const { error: createError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            tier: 'pro', // Use 'pro' instead of subscription.metadata.tier to avoid constraint violation
            status: 'active',
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer,
            interview_time_remaining: monthlyMinutes,
            interview_time_total: monthlyMinutes,
            current_period_start: (subscription as any).current_period_start ? new Date((subscription as any).current_period_start * 1000).toISOString() : new Date().toISOString(),
            current_period_end: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
          
        if (createError) {
          console.error('Webhook: Error creating subscription:', createError);
          return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
        }
        
        console.log(`Webhook: ✅ Successfully created subscription for user ${userId}`);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Processed subscription for user ${userId}`,
        minutesGranted: monthlyMinutes
      });
      
    } catch (error) {
      console.error('Webhook: Error processing subscription creation:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
  // Handle subscription renewals and first payments
  else if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    console.log('Webhook: Processing invoice.payment_succeeded for invoice:', invoice.id);
    
    // Only process subscription invoices (not one-time payments)
    if ((invoice as any).subscription && (invoice as any).billing_reason === 'subscription_cycle') {
      try {
        const supabase = createAdminClient();
        
        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription);
        console.log('Webhook: Retrieved subscription:', subscription.id);
        
        // Extract user ID from subscription metadata
        const userId = subscription.metadata.userId;
        if (!userId) {
          console.error('Webhook: Missing userId in subscription metadata');
          return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }
        
        // Calculate minutes for the subscription based on tier
        let monthlyMinutes = 480; // Default: 8 hours = 480 minutes for Monthly Credits
        if (subscription.metadata.tier === 'enterprise') {
          monthlyMinutes = 960; // 16 hours = 960 minutes for Enterprise
        } else if (subscription.metadata.tier === 'basic') {
          monthlyMinutes = 60; // 1 hour = 60 minutes for Basic
        } else if (subscription.metadata.tier === 'monthly-credits') {
          monthlyMinutes = 480; // 8 hours = 480 minutes for Monthly Credits Plan
        }
        
        console.log(`Webhook: Processing subscription payment for user ${userId}: ${monthlyMinutes} minutes`);
        
        // Check if this is a new subscription or renewal
        const { data: existingSubscription } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('stripe_subscription_id', subscription.id)
          .single();
        
        if (existingSubscription) {
          // This is a renewal - refresh credits to full amount
          console.log(`Webhook: Renewing subscription for user ${userId}`);
          
          const { error: updateError } = await supabase
            .from('user_subscriptions')
            .update({
              interview_time_remaining: monthlyMinutes,
              interview_time_total: monthlyMinutes,
              status: 'active',
              current_period_start: (subscription as any).current_period_start ? new Date((subscription as any).current_period_start * 1000).toISOString() : new Date().toISOString(),
              current_period_end: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingSubscription.id);
            
          if (updateError) {
            console.error('Webhook: Error updating subscription:', updateError);
            return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
          }
        } else {
          // This is a new subscription
          console.log(`Webhook: Creating new Pro subscription for user ${userId}`);
          
          const { error: createError } = await supabase
            .from('user_subscriptions')
            .insert({
              user_id: userId,
              tier: 'pro', // Use 'pro' to match database constraint
              status: 'active',
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer,
              interview_time_remaining: monthlyMinutes,
              interview_time_total: monthlyMinutes,
              current_period_start: (subscription as any).current_period_start ? new Date((subscription as any).current_period_start * 1000).toISOString() : new Date().toISOString(),
              current_period_end: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            });
            
          if (createError) {
            console.error('Webhook: Error creating subscription:', createError);
            return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
          }
        }
        
        console.log(`Webhook: ✅ Successfully processed subscription payment for user ${userId}`);
        
        return NextResponse.json({ 
          success: true, 
          message: `Processed subscription payment for user ${userId}`,
          minutesGranted: monthlyMinutes
        });
        
      } catch (error) {
        console.error('Webhook: Error processing subscription payment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }
  }

  // Handle subscription cancellation
  else if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    console.log('Webhook: Processing customer.subscription.deleted for subscription:', subscription.id);
    
    try {
      const supabase = createAdminClient();
      
      // Extract user ID from subscription metadata
      const userId = subscription.metadata.userId;
      if (!userId) {
        console.error('Webhook: Missing userId in subscription metadata');
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
      }
      
      console.log(`Webhook: Cancelling subscription for user ${userId}`);
      
      // Update subscription status to cancelled but keep remaining credits
      const { error: cancelError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);
        
      if (cancelError) {
        console.error('Webhook: Error cancelling subscription:', cancelError);
        return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
      }
      
      console.log(`Webhook: ✅ Successfully cancelled subscription for user ${userId}`);
      
      return NextResponse.json({ 
        success: true, 
        message: `Cancelled subscription for user ${userId}`
      });
      
    } catch (error) {
      console.error('Webhook: Error processing subscription cancellation:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
