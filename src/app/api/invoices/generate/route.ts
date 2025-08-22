import { NextRequest, NextResponse } from 'next/server';
import { stripeInvoiceService } from '@/lib/stripeInvoiceService';
import { emailService } from '@/lib/emailService';

interface GenerateInvoiceRequest {
  type: 'one-time' | 'subscription';
  customerEmail: string;
  customerName: string;
  amount: number;
  description: string;
  packageName?: string;
  subscriptionId?: string;
  currency?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateInvoiceRequest = await request.json();
    
    if (!body.customerEmail || !body.customerName || !body.amount || !body.description || !body.type) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: customerEmail, customerName, amount, description, and type are required'
      }, { status: 400 });
    }

    // Ensure customer exists in Stripe
    const customer = await stripeInvoiceService.createOrGetCustomer(body.customerEmail, body.customerName);
    
    let invoice;
    
    if (body.type === 'one-time') {
      // Create one-time invoice
      invoice = await stripeInvoiceService.createOneTimeInvoice(
        customer,
        body.customerEmail,
        body.customerName,
        body.amount,
        body.description,
        'usd'
      );
    } else {
      // Create subscription invoice
      if (!body.subscriptionId) {
        return NextResponse.json({
          success: false,
          error: 'subscriptionId is required for subscription invoices'
        }, { status: 400 });
      }
      
      invoice = await stripeInvoiceService.createSubscriptionInvoice(
        customer,
        body.customerEmail,
        body.customerName,
        body.subscriptionId,
        'usd'
      );
    }

    if (!invoice) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create invoice'
      }, { status: 500 });
    }

    // Get the created invoice details
    const invoiceDetails = await stripeInvoiceService.getInvoice(invoice.invoiceId!);
    
    if (!invoiceDetails) {
      return NextResponse.json({
        success: false,
        error: 'Failed to retrieve invoice details'
      }, { status: 500 });
    }

    // Prepare invoice data for email
    const invoiceData = {
      to: body.customerEmail,
      username: body.customerName,
      invoiceNumber: invoiceDetails.number || 'N/A',
      invoiceDate: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 30 days from now
      amount: stripeInvoiceService.formatAmount(invoiceDetails.amount_due),
      currency: body.currency || 'USD',
      paymentStatus: (invoiceDetails.status === 'paid' ? 'paid' : invoiceDetails.status === 'open' ? 'pending' : 'overdue') as 'paid' | 'pending' | 'overdue',
      companyInfo: {
        name: 'Jastalk.AI',
        address: '123 AI Street',
        city: 'Tech City',
        state: 'TC',
        zip: '12345',
        country: 'United States',
        phone: '+1 (555) 123-4567',
        email: 'billing@jastalk.com'
      },
      customerInfo: {
        name: body.customerName
      },
      items: [{
        description: body.description,
        quantity: 1,
        unitPrice: stripeInvoiceService.formatAmount(invoiceDetails.amount_due),
        amount: stripeInvoiceService.formatAmount(invoiceDetails.amount_due)
      }],
      subtotal: stripeInvoiceService.formatAmount(invoiceDetails.amount_due),
      tax: undefined,
      total: stripeInvoiceService.formatAmount(invoiceDetails.amount_due)
    };

    // Send invoice email via SendGrid
    const emailResult = await emailService.sendInvoiceEmail(invoiceData);
    
    if (!emailResult) {
      console.warn('Failed to send invoice email via SendGrid');
      
      // Fallback: Send via Stripe
      if (invoiceDetails.id) {
        await stripeInvoiceService.sendInvoice(invoiceDetails.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice generated and sent successfully',
      invoiceId: invoiceDetails.id,
      invoiceNumber: invoiceDetails.number,
      emailSent: emailResult
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate invoice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
