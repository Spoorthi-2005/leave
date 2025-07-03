import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

interface WhatsAppMessage {
  to: string;
  body: string;
  media?: string;
}

export class WhatsAppWebService {
  private client: Client;
  private isReady = false;
  private qrCodeGenerated = false;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.client.on('qr', (qr) => {
      console.log('\n🔗 WhatsApp Web QR Code - Scan with your phone:');
      qrcode.generate(qr, { small: true });
      this.qrCodeGenerated = true;
    });

    this.client.on('ready', () => {
      console.log('✅ WhatsApp Web client is ready!');
      this.isReady = true;
    });

    this.client.on('authenticated', () => {
      console.log('✅ WhatsApp Web authenticated successfully');
    });

    this.client.on('disconnected', (reason) => {
      console.log('❌ WhatsApp Web disconnected:', reason);
      this.isReady = false;
    });

    this.client.on('auth_failure', (msg) => {
      console.error('❌ WhatsApp Web authentication failed:', msg);
    });
  }

  async initialize() {
    try {
      console.log('🔄 Initializing WhatsApp Web client...');
      await this.client.initialize();
    } catch (error) {
      console.error('❌ Failed to initialize WhatsApp Web:', error);
      throw error;
    }
  }

  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.isReady) {
      console.log('⚠️ WhatsApp Web client not ready. Message will be logged to console.');
      console.log(`📱 WhatsApp Message to ${phoneNumber}:`);
      console.log(message);
      return false;
    }

    try {
      // Format phone number (remove + and add country code if needed)
      const formattedNumber = phoneNumber.replace(/\D/g, '');
      const chatId = `${formattedNumber}@c.us`;

      await this.client.sendMessage(chatId, message);
      console.log(`✅ WhatsApp message sent to ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send WhatsApp message to ${phoneNumber}:`, error);
      // Fallback to console logging
      console.log(`📱 WhatsApp Message to ${phoneNumber}:`);
      console.log(message);
      return false;
    }
  }

  async sendLeaveNotification(
    phoneNumber: string,
    studentName: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    reason: string,
    status: 'approved' | 'rejected',
    reviewerName: string,
    comments: string
  ): Promise<boolean> {
    const statusIcon = status === 'approved' ? '✅' : '❌';
    const statusText = status === 'approved' ? 'APPROVED' : 'REJECTED';

    const message = `
╭─────────────────────────────────╮
│       📚 GVPCEW NOTIFICATION     │
│   Leave Management System      │
╰─────────────────────────────────╯

${statusIcon} **LEAVE ${statusText}**

👤 **Student:** ${studentName}
📅 **Leave Type:** ${leaveType}
🗓️ **Duration:** ${startDate} to ${endDate}
📝 **Reason:** ${reason}

👨‍🏫 **Reviewed by:** ${reviewerName}
💬 **Comments:** ${comments}

${status === 'approved' ? 
  '🎉 Your leave has been approved! Please ensure all academic responsibilities are managed.' :
  '📋 Your leave has been rejected. Please contact your reviewer for more details.'}

---
📍 Gayatri Vidya Parishad College of Engineering for Women
🌐 Automated Leave Management System
    `.trim();

    return await this.sendMessage(phoneNumber, message);
  }

  isClientReady(): boolean {
    return this.isReady;
  }

  getStatus(): string {
    if (this.isReady) {
      return 'WhatsApp Web connected and ready';
    } else if (this.qrCodeGenerated) {
      return 'Waiting for QR code scan';
    } else {
      return 'Initializing WhatsApp Web';
    }
  }

  async destroy() {
    if (this.client) {
      await this.client.destroy();
      this.isReady = false;
    }
  }
}

export const whatsAppWebService = new WhatsAppWebService();