import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

interface InvoiceEmailRequest {
  to: string;
  username: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: string;
  currency: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: string;
    amount: string;
  }>;
  subtotal: string;
  tax?: string;
  total: string;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  paymentMethod?: string;
  transactionId?: string;
  companyInfo: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
    email?: string;
  };
  customerInfo: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  downloadUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const invoiceData: InvoiceEmailRequest = await request.json();

    if (!invoiceData.to || !invoiceData.username || !invoiceData.invoiceNumber) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, username, and invoiceNumber are required'
      }, { status: 400 });
    }

    // Set API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const statusColor = {
      paid: '#38a169',
      pending: '#d69e2e',
      overdue: '#e53e3e'
    };

    const statusText = {
      paid: '✅ Paid',
      pending: '⏳ Pending',
      overdue: '⚠️ Overdue'
    };

    const invoiceEmail = {
      to: invoiceData.to,
      from: 'noreply@jastalk.com',
      fromName: 'Jastalk.AI Billing',
      subject: `🧾 Invoice #${invoiceData.invoiceNumber} - Jastalk.AI`,
      text: `Hi ${invoiceData.username}, your invoice #${invoiceData.invoiceNumber} for ${invoiceData.total} ${invoiceData.currency} is attached. Status: ${invoiceData.paymentStatus}.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 32px; font-weight: bold;">🧾 Invoice</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Thank you for your business!</p>
          </div>

          <!-- Invoice Header -->
          <div style="padding: 30px 20px; background: #f8fafc;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;">
              <!-- Company Info -->
              <div style="margin-bottom: 20px;">
                <h2 style="color: #2d3748; margin: 0 0 10px 0; font-size: 24px;">Jastalk.AI</h2>
                <div style="color: #4a5568; font-size: 14px; line-height: 1.6;">
                  <p style="margin: 5px 0;">${invoiceData.companyInfo.address}</p>
                  <p style="margin: 5px 0;">${invoiceData.companyInfo.city}, ${invoiceData.companyInfo.state} ${invoiceData.companyInfo.zip}</p>
                  <p style="margin: 5px 0;">${invoiceData.companyInfo.country}</p>
                  ${invoiceData.companyInfo.phone ? `<p style="margin: 5px 0;">📞 ${invoiceData.companyInfo.phone}</p>` : ''}
                  ${invoiceData.companyInfo.email ? `<p style="margin: 5px 0;">📧 ${invoiceData.companyInfo.email}</p>` : ''}
                </div>
              </div>

              <!-- Invoice Details -->
              <div style="text-align: right;">
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">Invoice Details</h3>
                  <div style="color: #4a5568; font-size: 14px; line-height: 1.8;">
                    <p style="margin: 5px 0;"><strong>Invoice #:</strong> ${invoiceData.invoiceNumber}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${invoiceData.invoiceDate}</p>
                    <p style="margin: 5px 0;"><strong>Due Date:</strong> ${invoiceData.dueDate}</p>
                    <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${statusColor[invoiceData.paymentStatus]}; font-weight: bold;">${statusText[invoiceData.paymentStatus]}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Customer Info -->
          <div style="padding: 20px; background: #edf2f7; border-left: 4px solid #667eea;">
            <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">Bill To</h3>
            <div style="color: #4a5568; font-size: 14px; line-height: 1.6;">
              <p style="margin: 5px 0; font-weight: bold;">${invoiceData.customerInfo.name}</p>
              ${invoiceData.customerInfo.address ? `<p style="margin: 5px 0;">${invoiceData.customerInfo.address}</p>` : ''}
              ${invoiceData.customerInfo.city ? `<p style="margin: 5px 0;">${invoiceData.customerInfo.city}, ${invoiceData.customerInfo.state || ''} ${invoiceData.customerInfo.zip || ''}</p>` : ''}
              ${invoiceData.customerInfo.country ? `<p style="margin: 5px 0;">${invoiceData.customerInfo.country}</p>` : ''}
            </div>
          </div>

          <!-- Items Table -->
          <div style="padding: 20px;">
            <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">Items</h3>
            <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f7fafc;">
                    <th style="padding: 15px; text-align: left; color: #2d3748; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Description</th>
                    <th style="padding: 15px; text-align: center; color: #2d3748; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Qty</th>
                    <th style="padding: 15px; text-align: right; color: #2d3748; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Unit Price</th>
                    <th style="padding: 15px; text-align: right; color: #2d3748; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoiceData.items.map(item => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 15px; color: #2d3748; font-size: 14px;">${item.description}</td>
                      <td style="padding: 15px; text-align: center; color: #4a5568; font-size: 14px;">${item.quantity}</td>
                      <td style="padding: 15px; text-align: right; color: #4a5568; font-size: 14px;">${item.unitPrice}</td>
                      <td style="padding: 15px; text-align: right; color: #4a5568; font-size: 14px; font-weight: 600;">${item.amount}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Totals -->
          <div style="padding: 20px; background: #f8fafc;">
            <div style="max-width: 400px; margin-left: auto;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #4a5568; font-size: 16px;">Subtotal:</span>
                <span style="color: #2d3748; font-size: 16px; font-weight: 600;">${invoiceData.subtotal}</span>
              </div>
              ${invoiceData.tax ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #4a5568; font-size: 16px;">Tax:</span>
                <span style="color: #2d3748; font-size: 16px; font-weight: 600;">${invoiceData.tax}</span>
              </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding-top: 15px; border-top: 2px solid #e2e8f0;">
                <span style="color: #2d3748; font-size: 18px; font-weight: bold;">Total:</span>
                <span style="color: #2d3748; font-size: 20px; font-weight: bold;">${invoiceData.total} ${invoiceData.currency}</span>
              </div>
            </div>
          </div>

          <!-- Payment Info -->
          ${invoiceData.paymentMethod || invoiceData.transactionId ? `
          <div style="padding: 20px; background: #f0fff4; border-left: 4px solid #38a169;">
            <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">Payment Information</h3>
            <div style="color: #4a5568; font-size: 14px; line-height: 1.6;">
              ${invoiceData.paymentMethod ? `<p style="margin: 5px 0;"><strong>Payment Method:</strong> ${invoiceData.paymentMethod}</p>` : ''}
              ${invoiceData.transactionId ? `<p style="margin: 5px 0;"><strong>Transaction ID:</strong> <span style="font-family: monospace;">${invoiceData.transactionId}</span></p>` : ''}
            </div>
          </div>
          ` : ''}

          <!-- Action Buttons -->
          <div style="text-align: center; margin: 30px 0;">
            ${invoiceData.downloadUrl ? `
            <a href="${invoiceData.downloadUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 0 10px;">
              📥 Download Invoice
            </a>
            ` : ''}
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://jastalk.com'}/account" style="background: #38a169; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 0 10px;">
              👤 View Account
            </a>
          </div>

          <!-- Footer -->
          <div style="background: #2d3748; padding: 30px 20px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 14px; opacity: 0.8;">
              Questions about this invoice? Contact us at <a href="mailto:billing@jastalk.com" style="color: #63b3ed;">billing@jastalk.com</a>
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.6;">
              © 2024 Jastalk.AI. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    // Send the email
    await sgMail.send(invoiceEmail);

    return NextResponse.json({
      success: true,
      message: 'Invoice email sent successfully!',
      details: {
        to: invoiceData.to,
        username: invoiceData.username,
        invoiceNumber: invoiceData.invoiceNumber,
        subject: invoiceEmail.subject
      }
    });

  } catch (error) {
    console.error('Invoice email error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to send invoice email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
