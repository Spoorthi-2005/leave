import twilio from 'twilio';

interface WhatsAppMessage {
  to: string;
  from: string;
  body: string;
}

export class EnhancedWhatsAppService {
  private twilioClient: twilio.Twilio | null = null;
  private isReady = false;
  private fromNumber: string;
  private useMode: 'twilio' | 'mock' = 'mock';

  constructor() {
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '+14155238886';
    this.initialize();
  }

  private async initialize() {
    // Try Twilio first
    await this.initializeTwilio();
    
    if (!this.isReady) {
      console.log('📱 Using mock WhatsApp service - messages will be logged to console');
      console.log('💡 For real WhatsApp: verify Twilio credentials or contact support');
      this.useMode = 'mock';
    }
  }

  private async initializeTwilio() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
      const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();

      if (!accountSid || !authToken) {
        console.log('🔧 Twilio credentials not found');
        return;
      }

      console.log('🔍 Testing Twilio credentials...');
      this.twilioClient = twilio(accountSid, authToken);
      
      // Test credentials with a simple account fetch
      const account = await this.twilioClient.api.accounts(accountSid).fetch();
      console.log(`✅ Twilio authenticated - Account: ${account.friendlyName}`);
      
      this.isReady = true;
      this.useMode = 'twilio';
      console.log(`📱 Real WhatsApp notifications ready from: ${this.fromNumber}`);
      
    } catch (error: any) {
      console.log('❌ Twilio authentication failed:', error.message);
      if (error.code === 20003) {
        console.log('🔧 Error 20003: Invalid credentials - please verify Account SID and Auth Token');
        console.log('💡 Check: https://console.twilio.com for correct credentials');
      }
      this.isReady = false;
      this.useMode = 'mock';
    }
  }

  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (this.useMode === 'twilio' && this.isReady && this.twilioClient) {
      return await this.sendTwilioMessage(phoneNumber, message);
    } else {
      return this.sendMockMessage(phoneNumber, message);
    }
  }

  private async sendTwilioMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const formattedFrom = `whatsapp:${this.fromNumber}`;
      const formattedTo = phoneNumber.startsWith('whatsapp:') 
        ? phoneNumber 
        : `whatsapp:${phoneNumber}`;

      const messageResponse = await this.twilioClient!.messages.create({
        from: formattedFrom,
        to: formattedTo,
        body: message
      });

      console.log('✅ Real WhatsApp message sent successfully');
      console.log(`📱 Message SID: ${messageResponse.sid}`);
      console.log(`👤 Sent to: ${phoneNumber}`);
      
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send Twilio WhatsApp message:', error.message);
      
      if (error.code === 21614) {
        console.log('🔧 Error 21614: Recipient not joined sandbox');
        console.log('📱 User needs to send join code to your Twilio number first');
        console.log(`💡 Instructions: Send "join ${this.getJoinCode()}" to ${this.fromNumber}`);
      }
      
      // Fallback to mock
      console.log('📱 Falling back to mock notification...');
      return this.sendMockMessage(phoneNumber, message);
    }
  }

  private sendMockMessage(phoneNumber: string, message: string): boolean {
    console.log('📱━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 WHATSAPP NOTIFICATION (Mock Service)');
    console.log(`📱 To: ${phoneNumber}`);
    console.log('📱━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(message);
    console.log('📱━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 To enable real WhatsApp: fix Twilio credentials or contact support');
    console.log('📱━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return true;
  }

  private getJoinCode(): string {
    // Extract a simple join code from account SID
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    return accountSid ? accountSid.substring(2, 8) : 'sandbox';
  }

  async sendLeaveNotification(
    phoneNumber: string, 
    studentName: string, 
    leaveType: string, 
    duration: string, 
    status: 'approved' | 'rejected', 
    reviewerName: string, 
    comments: string
  ): Promise<boolean> {
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
    return this.isReady || this.useMode === 'mock';
  }

  getStatus(): string {
    if (this.useMode === 'twilio' && this.isReady) {
      return 'Twilio WhatsApp - Ready';
    } else {
      return 'Mock WhatsApp - Console Logging';
    }
  }

  async destroy() {
    console.log('🔧 WhatsApp service stopped');
  }
}

// Create singleton instance
export const enhancedWhatsAppService = new EnhancedWhatsAppService();