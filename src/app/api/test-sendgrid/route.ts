import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing SendGrid email functionality...');
    
    // Check environment variables
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@jastalk.com';
    const fromName = process.env.SENDGRID_FROM_NAME || 'Jastalk.AI';
    
    console.log('🔑 Environment check:', {
      hasApiKey: !!sendgridApiKey,
      apiKeyLength: sendgridApiKey?.length || 0,
      fromEmail,
      fromName
    });
    
    if (!sendgridApiKey) {
      return NextResponse.json({
        success: false,
        error: 'SENDGRID_API_KEY not configured',
        env: process.env.NODE_ENV
      }, { status: 500 });
    }
    
    // Set API key
    sgMail.setApiKey(sendgridApiKey);
    console.log('✅ SendGrid API key set');
    
    // Get test data from request
    const { to, testType = 'simple' } = await request.json();
    
    if (!to) {
      return NextResponse.json({
        success: false,
        error: 'Email address required'
      }, { status: 400 });
    }
    
    console.log('📧 Sending test email to:', to, 'Type:', testType);
    
    let testEmail;
    
    if (testType === 'pause-summary') {
      // Test the actual pause summary email format
      testEmail = {
        to,
        from: `${fromName} <${fromEmail}>`,
        subject: `🧪 TEST - Jastalk.AI Interview Performance Report`,
        text: `This is a test email for the pause summary functionality. If you receive this, SendGrid is working correctly.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1e40af;">🧪 SendGrid Test Email</h1>
            <p>This is a test email for the <strong>Jastalk.AI Interview Pause Summary</strong> functionality.</p>
            <p>If you receive this email, it means:</p>
            <ul>
              <li>✅ SendGrid API key is valid</li>
              <li>✅ SendGrid service is working</li>
              <li>✅ Email routing is functional</li>
            </ul>
            <p><strong>Test Details:</strong></p>
            <ul>
              <li>From: ${fromName} (${fromEmail})</li>
              <li>To: ${to}</li>
              <li>Time: ${new Date().toISOString()}</li>
              <li>Type: Pause Summary Test</li>
            </ul>
            <hr>
            <p style="color: #6b7280; font-size: 12px;">
              This is a test email. Please ignore if received unexpectedly.
            </p>
          </div>
        `
      };
    } else {
      // Simple test email
      testEmail = {
        to,
        from: `${fromName} <${fromEmail}>`,
        subject: `🧪 TEST - SendGrid Connection Test`,
        text: `This is a simple test email to verify SendGrid connectivity.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>🧪 SendGrid Test</h2>
            <p>This is a simple test email to verify SendGrid connectivity.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>
        `
      };
    }
    
    console.log('📤 Attempting to send email...');
    
    // Send with retry logic
    const maxRetries = 3;
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📧 SendGrid attempt ${attempt}/${maxRetries}`);
        
        const result = await sgMail.send(testEmail);
        
        console.log('✅ Email sent successfully!', {
          attempt,
          messageId: result[0]?.headers['x-message-id'],
          statusCode: result[0]?.statusCode,
          headers: result[0]?.headers
        });
        
        return NextResponse.json({
          success: true,
          message: 'Test email sent successfully',
          attempt,
          messageId: result[0]?.headers['x-message-id'],
          statusCode: result[0]?.statusCode,
          sendgridResponse: result
        });
        
      } catch (error: any) {
        lastError = error;
        console.error(`❌ SendGrid attempt ${attempt} failed:`, {
          error: error.message,
          code: error.code,
          response: error.response?.body,
          statusCode: error.code
        });
        
        if (attempt === maxRetries) break;
        
        // Wait before retry
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // All attempts failed
    console.error('❌ All SendGrid attempts failed. Final error:', lastError);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to send test email after all retries',
      details: {
        attempts: maxRetries,
        lastError: lastError?.message || 'Unknown error',
        errorCode: lastError?.code || 'N/A',
        sendgridResponse: lastError?.response?.body || 'N/A'
      }
    }, { status: 500 });
    
  } catch (error) {
    console.error('❌ Unexpected error in SendGrid test:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
