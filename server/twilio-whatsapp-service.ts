import twilio from 'twilio';

interface WhatsAppMessage {
  to: string;
  from: string;
  body: string;
}

export class TwilioWhatsAppService {
  private client: twilio.Twilio | null = null;
  private isReady = false;
  private fromNumber: string;

  constructor() {
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '+14155238886';
    this.initialize();
  }

  private async initialize() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
      const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();

      if (!accountSid || !authToken) {
        console.log('🔧 Twilio credentials not found - using mock WhatsApp service');
        console.log('📱 Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to enable real WhatsApp');
        this.isReady = false;
        return;
      }

      // Log sanitized credentials for debugging
      console.log(`🔍 Account SID: ${accountSid.substring(0, 10)}...`);
      console.log(`🔍 Auth Token: ${authToken.substring(0, 8)}...`);

      this.client = twilio(accountSid, authToken);
      
      // Test the credentials by making a simple API call
      await this.client.api.accounts(accountSid).fetch();
      
      this.isReady = true;
      console.log('✅ Twilio WhatsApp service initialized successfully');
      console.log(`📱 WhatsApp notifications will be sent from: ${this.fromNumber}`);
      
    } catch (error: any) {
      console.error('❌ Failed to initialize Twilio WhatsApp service:', error.message);
      if (error.code === 20003) {
        console.log('🔧 Authentication failed - please verify Account SID and Auth Token');
      }
      this.isReady = false;
    }
  }

  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.isReady || !this.client) {
      console.log('📱 WhatsApp service not ready. Message would be sent to:', phoneNumber);
      console.log('📝 Message content:');
      console.log(message);
      return false;
    }

    try {
      // Format phone number for WhatsApp
      const formattedFrom = `whatsapp:${this.fromNumber}`;
      const formattedTo = phoneNumber.startsWith('whatsapp:') 
        ? phoneNumber 
        : `whatsapp:${phoneNumber}`;

      const messageResponse = await this.client.messages.create({
        from: formattedFrom,
        to: formattedTo,
        body: message
      });

      console.log('✅ WhatsApp message sent successfully');
      console.log(`📱 Message SID: ${messageResponse.sid}`);
      console.log(`👤 Sent to: ${phoneNumber}`);
      
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send WhatsApp message:', error);
      
      if (error.code === 21614) {
        console.log('🔧 Tip: Make sure the recipient has joined your WhatsApp sandbox');
        console.log('📱 They need to send the join code to your Twilio number first');
      }
      
      // Fallback to console logging
      console.log('📱 Fallback - Message would be sent to:', phoneNumber);
      console.log('📝 Message content:');
      console.log(message);
      
      return false;
    }
  }

  async sendLeaveNotification(phoneNumber: string, studentName: string, leaveType: string, duration: string, status: 'approved' | 'rejected', reviewerName: string, comments: string): Promise<boolean> {
    const statusIcon = status === 'approved' ? '✅' : '❌';
    const statusText = status === 'approved' ? 'APPROVED' : 'REJECTED';
    const guidance = status === 'approved' 
      ? 'Your leave application has been approved. Please ensure all pending work is completed before your leave period.'
      : 'Your leave application has been rejected. Please contact your supervisor for more details.';

    const message = `🏫 *GVPCEW Leave Management System*

${statusIcon} *Leave Application ${statusText}*

👤 *Student:* ${studentName}
📅 *Leave Type:* ${leaveType}
🗓️ *Duration:* ${duration}

👨‍💼 *Reviewed by:* ${reviewerName}
💬 *Comments:* ${comments}

✨ ${guidance}

📱 *Gayatri Vidya Parishad College of Engineering for Women*`;

    return await this.sendMessage(phoneNumber, message);
  }

  isClientReady(): boolean {
    return this.isReady;
  }

  async destroy() {
    if (this.client) {
      console.log('🔧 Twilio WhatsApp service stopped');
    }
  }
}

// Create singleton instance
export const twilioWhatsAppService = new TwilioWhatsAppService();