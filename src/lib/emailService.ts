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
  resetUrl: string;
  expiresIn: string;
}

export interface InterviewCompletionData extends EmailData {
  interviewTitle: string;
  score: number;
  totalQuestions: number;
  duration: string;
  feedback: string;
  improvementTips: string[];
  nextSteps: string;
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

  // Send interview pause summary email
  async sendInterviewPauseSummaryEmail(data: InterviewPauseSummaryData): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/emails/interview-pause-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Interview pause summary email failed:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Interview pause summary email error:', error);
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
export const sendTestEmail = emailService.sendTestEmail.bind(emailService);
export const sendMultipleEmails = emailService.sendMultipleEmails.bind(emailService);
