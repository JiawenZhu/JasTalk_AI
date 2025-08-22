import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST!, {
  apiVersion: '2025-07-30.basil',
});

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number; // in cents
  amount: number; // in cents
}

export interface InvoiceData {
  customerId: string;
  customerEmail: string;
  customerName: string;
  items: InvoiceItem[];
  currency: string;
  metadata?: Record<string, string>;
  dueDate?: number; // Unix timestamp
  autoAdvance?: boolean;
}

export interface InvoiceResult {
  success: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  error?: string;
}

export class StripeInvoiceService {
  /**
   * Create a very simple invoice for a customer
   */
  async createSimpleInvoice(
    customerId: string,
    customerEmail: string,
    customerName: string,
    amount: number, // in cents
    description: string,
    currency: string = 'usd'
  ): Promise<InvoiceResult> {
    try {
      // Create a simple invoice with minimal parameters
      const invoice = await stripe.invoices.create({
        customer: customerId,
        collection_method: 'send_invoice',
        days_until_due: 30,
        metadata: {
          type: 'one_time_purchase',
          description,
          customerEmail,
          customerName,
        },
      } as any);

      // Finalize the invoice
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id!);

      return {
        success: true,
        invoiceId: finalizedInvoice.id,
        invoiceNumber: finalizedInvoice.number || undefined,
        invoiceUrl: finalizedInvoice.hosted_invoice_url || undefined,
      };
    } catch (error) {
      console.error('Error creating Stripe invoice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create an invoice for a one-time purchase
   */
  async createOneTimeInvoice(
    customerId: string,
    customerEmail: string,
    customerName: string,
    amount: number, // in cents
    description: string,
    currency: string = 'usd'
  ): Promise<InvoiceResult> {
    return this.createSimpleInvoice(customerId, customerEmail, customerName, amount, description, currency);
  }

  /**
   * Create an invoice for a subscription
   */
  async createSubscriptionInvoice(
    customerId: string,
    customerEmail: string,
    customerName: string,
    subscriptionId: string,
    currency: string = 'usd'
  ): Promise<InvoiceResult> {
    try {
      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // Get the first item for simplicity
      const firstItem = subscription.items.data[0];
      const amount = (firstItem.price.unit_amount || 0) * (firstItem.quantity || 1);
      const description = `Subscription: ${firstItem.price.product}`;

      return this.createSimpleInvoice(customerId, customerEmail, customerName, amount, description, currency);
    } catch (error) {
      console.error('Error creating subscription invoice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send an invoice to a customer
   */
  async sendInvoice(invoiceId: string): Promise<boolean> {
    try {
      await stripe.invoices.sendInvoice(invoiceId);
      return true;
    } catch (error) {
      console.error('Error sending invoice:', error);
      return false;
    }
  }

  /**
   * Mark an invoice as paid
   */
  async markInvoiceAsPaid(invoiceId: string): Promise<boolean> {
    try {
      await stripe.invoices.pay(invoiceId);
      return true;
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      return false;
    }
  }

  /**
   * Get invoice details
   */
  async getInvoice(invoiceId: string) {
    try {
      return await stripe.invoices.retrieve(invoiceId);
    } catch (error) {
      console.error('Error retrieving invoice:', error);
      return null;
    }
  }

  /**
   * List all invoices for a customer
   */
  async listCustomerInvoices(customerId: string, limit: number = 10) {
    try {
      return await stripe.invoices.list({
        customer: customerId,
        limit,
      });
    } catch (error) {
      console.error('Error listing customer invoices:', error);
      return null;
    }
  }

  /**
   * Create a customer if they don't exist
   */
  async createOrGetCustomer(email: string, name: string): Promise<string> {
    try {
      // Check if customer already exists
      const existingCustomers = await stripe.customers.list({
        email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0].id;
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          source: 'jastalk_ai',
        },
      });

      return customer.id;
    } catch (error) {
      console.error('Error creating/getting customer:', error);
      throw error;
    }
  }

  /**
   * Format amount from cents to dollars
   */
  formatAmount(amount: number, currency: string = 'usd'): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    });
    
    return formatter.format(amount / 100);
  }

  /**
   * Get invoice status
   */
  getInvoiceStatus(invoice: Stripe.Invoice): 'draft' | 'open' | 'paid' | 'uncollectible' | 'void' {
    return invoice.status || 'draft';
  }

  /**
   * Check if invoice is overdue
   */
  isInvoiceOverdue(invoice: Stripe.Invoice): boolean {
    if (invoice.status !== 'open') return false;
    
    const now = Math.floor(Date.now() / 1000);
    return invoice.due_date ? now > invoice.due_date : false;
  }
}

// Export singleton instance
export const stripeInvoiceService = new StripeInvoiceService();






