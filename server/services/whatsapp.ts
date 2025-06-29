interface WhatsAppMessage {
  to: string;
  message: string;
  type?: 'text' | 'template';
}

interface WhatsAppConfig {
  apiUrl: string;
  accessToken: string;
  phoneNumberId: string;
}

export class WhatsAppService {
  private config: WhatsAppConfig;

  constructor() {
    this.config = {
      apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || ''
    };
  }

  async sendMessage(to: string, message: string): Promise<boolean> {
    if (!this.config.accessToken || !this.config.phoneNumberId) {
      console.log('WhatsApp API not configured. Message would be sent to:', to);
      console.log('Message content:', message);
      return true; // Simulate success for demo
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/${this.config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to.replace(/\D/g, ''), // Remove non-digits
          type: 'text',
          text: {
            body: message
          }
        })
      });

      if (response.ok) {
        console.log(`WhatsApp message sent successfully to ${to}`);
        return true;
      } else {
        console.error('WhatsApp API error:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('WhatsApp service error:', error);
      return false;
    }
  }

  async sendLeaveNotification(
    phoneNumber: string,
    studentName: string,
    status: 'approved' | 'rejected',
    leaveType: string,
    reviewerName: string,
    comments?: string
  ): Promise<boolean> {
    const statusEmoji = status === 'approved' ? '✅' : '❌';
    const statusText = status.toUpperCase();
    
    const message = `
${statusEmoji} *GVPCEW Leave Management*

Dear ${studentName},

Your *${leaveType}* leave application has been *${statusText}*

👤 *Reviewed by:* ${reviewerName}
${comments ? `💬 *Comments:* ${comments}` : ''}

${status === 'approved' 
  ? '✨ Please ensure all handover procedures are completed before your leave begins.' 
  : '📞 Please contact your class teacher for more information.'
}

---
*Gayatri Vidya Parishad College of Engineering for Women*
*Madhurawada, Visakhapatnam*
    `.trim();

    return await this.sendMessage(phoneNumber, message);
  }

  async sendLeaveApplicationAlert(
    phoneNumber: string,
    teacherName: string,
    studentName: string,
    leaveType: string,
    fromDate: string,
    toDate: string
  ): Promise<boolean> {
    const message = `
🔔 *GVPCEW Leave Management Alert*

Dear ${teacherName},

A new leave application requires your review:

👤 *Student:* ${studentName}
📝 *Leave Type:* ${leaveType}
📅 *Duration:* ${fromDate} to ${toDate}
⏰ *Applied:* ${new Date().toLocaleString()}

Please log in to the Leave Management System to review this application.

---
*Gayatri Vidya Parishad College of Engineering for Women*
    `.trim();

    return await this.sendMessage(phoneNumber, message);
  }

  async sendBulkLeaveReminder(recipients: Array<{phone: string, name: string}>): Promise<void> {
    const message = `
📢 *GVPCEW Leave Management Reminder*

Dear Faculty/Student,

This is a reminder to check your leave applications and approvals in the GVPCEW Leave Management System.

🔗 Please log in to review pending items.

---
*Gayatri Vidya Parishad College of Engineering for Women*
    `.trim();

    for (const recipient of recipients) {
      try {
        await this.sendMessage(recipient.phone, message);
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to send reminder to ${recipient.name}:`, error);
      }
    }
  }

  async sendHolidayAnnouncement(
    recipients: Array<{phone: string, name: string}>,
    holidayName: string,
    date: string
  ): Promise<void> {
    const message = `
🎉 *GVPCEW Holiday Announcement*

Dear Students and Faculty,

*${holidayName}* is declared as a holiday on *${date}*.

📚 All classes and regular activities are suspended for the day.
🏛️ Administrative offices will remain closed.

Enjoy the holiday!

---
*Gayatri Vidya Parishad College of Engineering for Women*
*Administration Office*
    `.trim();

    for (const recipient of recipients) {
      try {
        await this.sendMessage(recipient.phone, message);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to send holiday announcement to ${recipient.name}:`, error);
      }
    }
  }
}

export const whatsappService = new WhatsAppService();