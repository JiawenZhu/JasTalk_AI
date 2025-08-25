// Email service for Jastalk.AI application
// Handles all email sending operations through SendGrid API

export interface EmailData {
  to: string;
  username: string;
}

export interface WelcomeEmailData extends EmailData {
  verificationUrl?: string;
}

export interface PasswordResetData extends EmailData {
  username: string;
  resetUrl: string;
  expiryTime: string;
  supportEmail: string;
  requestTime: string;
  ipAddress: string;
}

export interface InterviewCompletionData extends EmailData {
  interviewTitle: string;
  score: number;
  totalQuestions: number;
  duration: string;
  feedback: string;
  improvementTips: string[];
  nextSteps: string;
  // Gemini analysis fields for enhanced completion reports
  geminiAnalysis?: {
    analysisType?: string;
    executiveSummary: string;
    detailedLog: string;
    keyInsights: string[];
    qualityAssessment: {
      score: number;
      reasoning: string;
    };
    discrepancyAnalysis: string;
    recommendations: string[];
    localVsGemini: {
      localCapturedTurns: number;
      localSpeakers: string[];
      analysisQuality: number | string;
    };
  };
}

export interface CreditPurchaseData extends EmailData {
  packageName: string;
  credits: number;
  amount: string;
  transactionId: string;
  newBalance: number;
  expiryDate?: string;
}

export interface SecurityAlertData extends EmailData {
  alertType: 'login_attempt' | 'password_change' | 'suspicious_activity' | 'account_locked';
  location?: string;
  deviceInfo?: string;
  timestamp: string;
  actionRequired?: boolean;
  actionUrl?: string;
}

export interface InvoiceEmailData extends EmailData {
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

export interface InterviewPauseSummaryData extends EmailData {
  interviewerName: string;
  interviewTitle: string;
  questionsAnswered: number;
  totalQuestions: number;
  duration: string;
  conversationSummary: string;
  detailedLogs: Array<{
    speaker: 'user' | 'ai';
    text: string;
    timestamp: string;
  }>;
  resumeUrl: string;
  // New Gemini analysis fields
  geminiAnalysis?: {
    executiveSummary: string;
    detailedLog: string;
    keyInsights: string[];
    qualityAssessment: {
      score: number;
      reasoning: string;
    };
    discrepancyAnalysis: string;
    recommendations: string[];
    localVsGemini: {
      localCapturedTurns: number;
      localSpeakers: string[];
      analysisQuality: number | string;
    };
  };
}

export interface NewLoginAlertData extends EmailData {
  username: string;
  loginTime: string;
  location: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent: string;
  loginUrl: string;
  secureAccountUrl: string;
  supportEmail: string;
}

export interface PasswordResetData extends EmailData {
  username: string;
  resetUrl: string;
  expiryTime: string;
  supportEmail: string;
  requestTime: string;
  ipAddress: string;
}

export interface AccountVerificationData extends EmailData {
  username: string;
  verificationUrl: string;
  expiryTime: string;
  supportEmail: string;
  accountType: 'signup' | 'email_change';
}

class EmailService {
  private getBaseUrl(): string {
    // Use window.location for client-side, fallback to environment variable
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }

  // Send welcome email for new user signup
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      const baseUrl = this.getBaseUrl();
      console.log('Sending welcome email to:', data.to, 'using baseUrl:', baseUrl);
      
      const response = await fetch(`${baseUrl}/api/emails/welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Welcome email failed:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Welcome email error:', error);
      return false;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(data: PasswordResetData): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/emails/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Password reset email failed:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Password reset email error:', error);
      return false;
    }
  }

  // Send interview completion email
  async sendInterviewCompletionEmail(data: InterviewCompletionData): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/emails/interview-completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Interview completion email failed:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Interview completion email error:', error);
      return false;
    }
  }

  // Send credit purchase confirmation email
  async sendCreditPurchaseEmail(data: CreditPurchaseData): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/emails/credit-purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Credit purchase email failed:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Credit purchase email error:', error);
      return false;
    }
  }

  // Send security alert email
  async sendSecurityAlertEmail(data: SecurityAlertData): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/emails/security-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Security alert email failed:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Security alert email error:', error);
      return false;
    }
  }

  // Send invoice email
  async sendInvoiceEmail(data: InvoiceEmailData): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/emails/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Invoice email failed:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Invoice email error:', error);
      return false;
    }
  }

  // Send interview pause summary email with retry logic
  async sendInterviewPauseSummaryEmail(data: InterviewPauseSummaryData): Promise<boolean> {
    const maxRetries = 3;
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📧 Email service: Attempt ${attempt}/${maxRetries} to send pause summary email`);
        
        const response = await fetch(`${this.getBaseUrl()}/api/emails/interview-pause-summary`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Email attempt ${attempt} failed with status ${response.status}:`, errorText);
          
          // Try to parse error details
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.details) {
              console.error('📋 Error details:', errorData.details);
            }
          } catch (parseError) {
            // Ignore parse errors
          }
          
          lastError = new Error(`HTTP ${response.status}: ${errorText}`);
          
          // If this is the last attempt, don't wait
          if (attempt === maxRetries) break;
          
          // Wait before retry (exponential backoff)
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Email service: Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        const result = await response.json();
        console.log('✅ Email sent successfully on attempt', attempt, 'Result:', result);
        return true;
        
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Email attempt ${attempt} failed with exception:`, error);
        
        // If this is the last attempt, don't wait
        if (attempt === maxRetries) break;
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Email service: Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    console.error('❌ All email attempts failed. Final error:', lastError);
    return false;
  }

  // Send new login alert email
  async sendNewLoginAlertEmail(data: NewLoginAlertData): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/emails/new-login-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('New login alert email failed:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('New login alert email error:', error);
      return false;
    }
  }

  // Send account verification email
  async sendAccountVerificationEmail(data: AccountVerificationData): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/emails/account-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Account verification email failed:', await response.text());
        return false;
      }

        return true;
    } catch (error) {
      console.error('Account verification email error:', error);
      return false;
    }
  }

  // Send basic test email
  async sendTestEmail(to: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to }),
      });

      if (!response.ok) {
        console.error('Test email failed:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Test email error:', error);
      return false;
    }
  }

  // Utility method to send multiple emails
  async sendMultipleEmails(emails: Array<{ type: string; data: any }>): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        let result = false;
        
        switch (email.type) {
          case 'welcome':
            result = await this.sendWelcomeEmail(email.data);
            break;
          case 'password-reset':
            result = await this.sendPasswordResetEmail(email.data);
            break;
          case 'new-login-alert':
            result = await this.sendNewLoginAlertEmail(email.data);
            break;
          case 'account-verification':
            result = await this.sendAccountVerificationEmail(email.data);
            break;
          case 'interview-completion':
            result = await this.sendInterviewCompletionEmail(email.data);
            break;
          case 'credit-purchase':
            result = await this.sendCreditPurchaseEmail(email.data);
            break;
          case 'security-alert':
            result = await this.sendSecurityAlertEmail(email.data);
            break;
          case 'interview-pause-summary':
            result = await this.sendInterviewPauseSummaryEmail(email.data);
            break;
          default:
            console.warn(`Unknown email type: ${email.type}`);
            failed++;
            continue;
        }

        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Email ${email.type} failed:`, error);
        failed++;
      }
    }

    return { success, failed };
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export bound methods to preserve 'this' context
export const sendWelcomeEmail = emailService.sendWelcomeEmail.bind(emailService);
export const sendPasswordResetEmail = emailService.sendPasswordResetEmail.bind(emailService);
export const sendInterviewCompletionEmail = emailService.sendInterviewCompletionEmail.bind(emailService);
export const sendCreditPurchaseEmail = emailService.sendCreditPurchaseEmail.bind(emailService);
export const sendSecurityAlertEmail = emailService.sendSecurityAlertEmail.bind(emailService);
export const sendInvoiceEmail = emailService.sendInvoiceEmail.bind(emailService);
export const sendInterviewPauseSummaryEmail = emailService.sendInterviewPauseSummaryEmail.bind(emailService);
export const sendNewLoginAlertEmail = emailService.sendNewLoginAlertEmail.bind(emailService);
export const sendAccountVerificationEmail = emailService.sendAccountVerificationEmail.bind(emailService);
export const sendTestEmail = emailService.sendTestEmail.bind(emailService);
export const sendMultipleEmails = emailService.sendMultipleEmails.bind(emailService);
