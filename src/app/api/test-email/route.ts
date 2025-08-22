import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

export async function POST(request: NextRequest) {
  try {
    // Set API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    // Test email message
    const msg = {
      to: process.env.TEST_EMAIL, // Your personal email for testing
      from: 'noreply@jastalk.com', // Your verified sender
      subject: '🎉 Jastalk.AI SendGrid Test Email',
      text: 'Congratulations! Your SendGrid integration is working perfectly. Your app can now send professional emails!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">🎉 Jastalk.AI SendGrid Test</h1>
          <p style="font-size: 18px; color: #374151;">
            Congratulations! Your SendGrid integration is working perfectly.
          </p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">What This Means:</h3>
            <ul style="color: #4b5563;">
              <li>✅ Professional emails from noreply@jastalk.com</li>
              <li>✅ High deliverability via SendGrid</li>
              <li>✅ Email analytics and tracking</li>
              <li>✅ Ready for production use</li>
            </ul>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Sent from your Jastalk.AI application using SendGrid
          </p>
        </div>
      `,
    };

    // Send the email
    await sgMail.send(msg);

    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully!',
      details: {
        from: msg.from,
        to: msg.to,
        subject: msg.subject
      }
    });

  } catch (error) {
    console.error('SendGrid test error:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}






