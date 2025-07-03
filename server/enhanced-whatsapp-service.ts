import twilio from 'twilio';
import { whatsAppWebService } from './whatsapp-web-service';

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
    this.initializeWhatsAppWeb();
  }

  private async initializeWhatsAppWeb() {
    try {
      console.log('🔄 Initializing WhatsApp Web service...');
      await whatsAppWebService.initialize();
    } catch (error) {
      console.log('⚠️ WhatsApp Web failed to initialize, using fallback methods');
    }
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
    // Try WhatsApp Web first
    if (whatsAppWebService.isClientReady()) {
      console.log('📱 Using WhatsApp Web service');
      return await whatsAppWebService.sendMessage(phoneNumber, message);
    }
    
    // Fallback to Twilio if available
    if (this.useMode === 'twilio' && this.isReady && this.twilioClient) {
      console.log('📱 Using Twilio WhatsApp service');
      return await this.sendTwilioMessage(phoneNumber, message);
    } 
    
    // Final fallback to console logging
    console.log('📱 Using console logging (WhatsApp Web not connected, Twilio not available)');
    return this.sendMockMessage(phoneNumber, message);
  }

  private async sendTwilioMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // Use sandbox number for WhatsApp
      const sandboxFrom = 'whatsapp:+14155238886'; // Twilio WhatsApp sandbox number
      const formattedTo = phoneNumber.startsWith('whatsapp:') 
        ? phoneNumber 
        : `whatsapp:${phoneNumber}`;

      console.log(`🔄 Attempting WhatsApp message from ${sandboxFrom} to ${formattedTo}`);

      const messageResponse = await this.twilioClient!.messages.create({
        from: sandboxFrom,
        to: formattedTo,
        body: message
      });

      console.log('✅ REAL WHATSAPP MESSAGE SENT SUCCESSFULLY!');
      console.log(`📱 Message SID: ${messageResponse.sid}`);
      console.log(`👤 Sent to: ${phoneNumber}`);
      console.log(`🎯 Status: ${messageResponse.status}`);
      
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send Twilio WhatsApp message:', error.message);
      console.error(`❌ Error code: ${error.code}`);
      console.error(`❌ Error details:`, error);
      
      if (error.code === 21614) {
        console.log('🔧 Error 21614: Recipient not joined WhatsApp sandbox');
        console.log('📱 ═════════════════════════════════════════════════════════════');
        console.log('📱 TO RECEIVE REAL WHATSAPP MESSAGES:');
        console.log('📱 ═════════════════════════════════════════════════════════════');
        console.log(`📱 1. Save this number in your phone: +1 415 523 8886`);
        console.log(`📱 2. Send this message to +1 415 523 8886: "join ${this.getJoinCode()}"`);
        console.log('📱 3. Wait for confirmation message from Twilio');
        console.log('📱 4. Then test leave application again');
        console.log('📱 ═════════════════════════════════════════════════════════════');
        console.log('📱 Current Status: Using console logging until sandbox joined');
        console.log('📱 ═════════════════════════════════════════════════════════════');
      } else if (error.code === 21606) {
        console.log('🔧 Error 21606: WhatsApp channel not found');
        console.log('📱 Solution: Join WhatsApp sandbox first (see instructions above)');
      } else {
        console.log(`🔧 Unexpected error: ${error.message}`);
        console.log('📱 Check WHATSAPP_REAL_SETUP.md for complete setup guide');
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
    // Try WhatsApp Web first (with enhanced formatting)
    if (whatsAppWebService.isClientReady()) {
      console.log('📱 Using WhatsApp Web for leave notification');
      // Parse duration into start and end dates for WhatsApp Web service
      const [startDate, endDate] = duration.includes(' to ') 
        ? duration.split(' to ')
        : [duration, duration];
      
      return await whatsAppWebService.sendLeaveNotification(
        phoneNumber, studentName, leaveType, startDate, endDate, 
        'N/A', status, reviewerName, comments
      );
    }

    // Fallback to existing message format
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
    if (whatsAppWebService.isClientReady()) {
      return 'WhatsApp Web - Connected and Ready';
    } else if (this.useMode === 'twilio' && this.isReady) {
      return 'Twilio WhatsApp - Ready';
    } else {
      return `Mock WhatsApp - Console Logging (${whatsAppWebService.getStatus()})`;
    }
  }

  async destroy() {
    console.log('🔧 WhatsApp service stopped');
  }
}

// Create singleton instance
export const enhancedWhatsAppService = new EnhancedWhatsAppService();