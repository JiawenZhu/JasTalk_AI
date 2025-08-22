import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

interface CreditPurchaseRequest {
  to: string;
  username: string;
  packageName: string;
  credits: number;
  amount: string;
  transactionId: string;
  newBalance: number;
  expiryDate?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      to, 
      username, 
      packageName, 
      credits, 
      amount, 
      transactionId, 
      newBalance,
      expiryDate 
    }: CreditPurchaseRequest = await request.json();

    if (!to || !username || !packageName || !credits || !amount || !transactionId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, username, packageName, credits, amount, and transactionId are required'
      }, { status: 400 });
    }

    // Set API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const purchaseEmail = {
      to,
      from: 'noreply@jastalk.com',
      fromName: 'Jastalk.AI Billing',
      subject: `💳 Purchase Confirmed: ${packageName}`,
      text: `Hi ${username}, your purchase of ${credits} interview credits has been confirmed! Amount: ${amount}. Transaction ID: ${transactionId}. Your new balance is ${newBalance} credits.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #38a169 0%, #2f855a 100%); padding: 40px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">💳 Purchase Confirmed!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Thank you for your purchase, ${username}!</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 20px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">${packageName}</h2>
            
            <!-- Purchase Summary -->
            <div style="background: #f0fff4; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; border: 2px solid #38a169;">
              <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
              <h3 style="color: #2d3748; margin: 10px 0; font-size: 24px;">Purchase Successful!</h3>
              <div style="font-size: 32px; font-weight: bold; color: #38a169; margin: 10px 0;">
                ${credits} Credits Added
              </div>
              <p style="color: #4a5568; margin: 5px 0; font-size: 18px;">
                Amount: <strong>${amount}</strong>
              </p>
              <p style="color: #718096; margin: 5px 0; font-size: 16px;">
                New Balance: <strong>${newBalance} credits</strong>
              </p>
            </div>

            <!-- Transaction Details -->
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #2d3748; margin-top: 0; margin-bottom: 15px;">📋 Transaction Details</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
                <div>
                  <strong style="color: #4a5568;">Transaction ID:</strong><br>
                  <span style="color: #718096; font-family: monospace;">${transactionId}</span>
                </div>
                <div>
                  <strong style="color: #4a5568;">Date:</strong><br>
                  <span style="color: #718096;">${new Date().toLocaleDateString()}</span>
                </div>
                <div>
                  <strong style="color: #4a5568;">Package:</strong><br>
                  <span style="color: #718096;">${packageName}</span>
                </div>
                <div>
                  <strong style="color: #4a5568;">Credits:</strong><br>
                  <span style="color: #718096;">${credits}</span>
                </div>
              </div>
            </div>

            ${expiryDate ? `
            <!-- Expiry Information -->
            <div style="background: #fffaf0; padding: 20px; border-radius: 8px; border-left: 4px solid #ed8936; margin: 25px 0;">
              <h4 style="color: #c05621; margin-top: 0;">⏰ Important Note</h4>
              <p style="color: #744210; margin: 0; font-size: 14px;">
                Your credits will expire on <strong>${expiryDate}</strong>. 
                Make sure to use them before the expiration date!
              </p>
            </div>
            ` : ''}

            <!-- What You Can Do -->
            <div style="background: #edf2f7; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #2d3748; margin-top: 0; margin-bottom: 15px;">🚀 What You Can Do Now:</h3>
              <ul style="color: #4a5568; margin: 0; font-size: 16px; line-height: 1.6; padding-left: 20px;">
                <li>Practice interviews with AI-powered interviewers</li>
                <li>Generate custom interview questions</li>
                <li>Get detailed feedback and analysis</li>
                <li>Track your progress over time</li>
              </ul>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://jastalk.com'}/practice" style="background: #38a169; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 0 10px;">
                🎯 Start Practicing
              </a>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://jastalk.com'}/account" style="background: #4299e1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 0 10px;">
                👤 View Account
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #2d3748; padding: 30px 20px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 14px; opacity: 0.8;">
              Questions about your purchase? Contact us at <a href="mailto:support@jastalk.com" style="color: #63b3ed;">support@jastalk.com</a>
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.6;">
              © 2024 Jastalk.AI. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    // Send the email
    await sgMail.send(purchaseEmail);

    return NextResponse.json({
      success: true,
      message: 'Credit purchase email sent successfully!',
      details: {
        to,
        username,
        packageName,
        credits,
        amount,
        transactionId,
        subject: purchaseEmail.subject
      }
    });

  } catch (error) {
    console.error('Credit purchase email error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to send credit purchase email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

