import { format } from 'date-fns';

class WhatsAppService {
  private isReady: boolean = true; // Mock service is always ready

  constructor() {
    // Mock service - no setup needed
  }

  async initialize() {
    console.log('WhatsApp Mock Service initialized - messages will be logged to console');
    console.log('📱 In production, replace with real WhatsApp Web API or Twilio integration');
  }

  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.isReady) {
      console.log('WhatsApp service not ready. Message queued:', message);
      return false;
    }

    try {
      // Format phone number (remove any non-digit characters and add country code if needed)
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      console.log('\n📱 === WhatsApp Notification ===');
      console.log(`📞 To: ${formattedNumber}`);
      console.log(`📝 Message:\n${message}`);
      console.log('================================\n');
      
      return true;
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      return false;
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let formatted = phoneNumber.replace(/\D/g, '');
    
    // If number starts with +91, remove the +
    if (formatted.startsWith('91')) {
      return formatted;
    }
    
    // If number doesn't have country code, add India's +91
    if (formatted.length === 10) {
      return `91${formatted}`;
    }
    
    return formatted;
  }

  async sendLeaveApprovalNotification(
    phoneNumber: string,
    studentName: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    duration: number,
    reviewerName: string,
    comments: string,
    status: 'approved' | 'rejected'
  ): Promise<boolean> {
    const statusIcon = status === 'approved' ? '✅' : '❌';
    const statusText = status === 'approved' ? 'APPROVED' : 'REJECTED';
    
    const message = `
🏫 *GVPCEW Leave Management System*

${statusIcon} *Leave Application ${statusText}*

👤 *Student:* ${studentName}
📅 *Leave Type:* ${leaveType}
🗓️ *Duration:* ${duration} days (${format(new Date(startDate), 'MMM dd')} - ${format(new Date(endDate), 'MMM dd, yyyy')})

👨‍💼 *Reviewed by:* ${reviewerName}
💬 *Comments:* ${comments}

${status === 'approved' 
  ? '✨ Your leave application has been approved. Please ensure all pending work is completed before your leave period.'
  : '⚠️ Your leave application has been rejected. Please contact your supervisor for more details.'
}

📱 *Gayatri Vidya Parishad College of Engineering for Women*
    `.trim();

    return await this.sendMessage(phoneNumber, message);
  }

  async sendLeaveStatusUpdate(
    phoneNumber: string,
    studentName: string,
    status: string,
    reviewerName: string
  ): Promise<boolean> {
    const message = `
🏫 *GVPCEW Leave Update*

Hi ${studentName},

Your leave application status has been updated to: *${status.toUpperCase()}*

Reviewed by: ${reviewerName}

For more details, please check your dashboard.

📱 *GVPCEW Leave Management System*
    `.trim();

    return await this.sendMessage(phoneNumber, message);
  }

  isClientReady(): boolean {
    return this.isReady;
  }

  async destroy() {
    console.log('WhatsApp mock service stopped');
  }
}

// Create singleton instance
export const whatsappService = new WhatsAppService();

// Initialize on module load
whatsappService.initialize().catch(console.error);