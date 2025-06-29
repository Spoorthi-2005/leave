import { emailService } from './email';
import { whatsappService } from './whatsapp';
import type { User, LeaveApplication } from '@shared/schema';

interface NotificationData {
  student: User;
  application: LeaveApplication;
  status: 'approved' | 'rejected';
  reviewerName: string;
  comments?: string;
}

export class NotificationService {
  async sendLeaveStatusNotification(data: NotificationData) {
    const { student, application, status, reviewerName, comments } = data;
    
    // Send email notification
    await this.sendEmailNotification(data);
    
    // Send WhatsApp notification (if phone number available)
    if (student.phoneNumber) {
      await this.sendWhatsAppNotification(data);
    }
  }

  private async sendEmailNotification(data: NotificationData) {
    const { student, application, status, reviewerName, comments } = data;
    
    const subject = `Leave Application ${status === 'approved' ? 'Approved' : 'Rejected'} - GVPCEW`;
    
    const emailContent = this.generateEmailContent(data);
    
    try {
      await emailService.sendLeaveStatusNotification(
        student.email,
        student.fullName,
        application.leaveType,
        status,
        reviewerName,
        comments
      );
      console.log(`Email notification sent to ${student.email} for leave ${status}`);
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  private async sendWhatsAppNotification(data: NotificationData) {
    const { student, application, status, reviewerName, comments } = data;
    
    try {
      await whatsappService.sendLeaveNotification(
        student.phoneNumber!,
        student.fullName,
        status,
        application.leaveType,
        reviewerName,
        comments
      );
      console.log(`WhatsApp notification sent to ${student.phoneNumber} for leave ${status}`);
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
    }
  }

  private generateEmailContent(data: NotificationData): string {
    const { student, application, status, reviewerName, comments } = data;
    
    const statusText = status === 'approved' ? 'APPROVED' : 'REJECTED';
    const statusColor = status === 'approved' ? '#10B981' : '#EF4444';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f7f9fc; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { color: #1f2937; font-size: 24px; font-weight: bold; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; background-color: ${statusColor}; }
          .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">GVPCEW Leave Management System</div>
            <p>Gayatri Vidya Parishad College of Engineering for Women</p>
          </div>
          
          <h2>Dear ${student.fullName},</h2>
          
          <p>Your leave application has been <span class="status-badge">${statusText}</span></p>
          
          <div class="details">
            <h3>Application Details:</h3>
            <p><strong>Leave Type:</strong> ${application.leaveType}</p>
            <p><strong>Duration:</strong> ${new Date(application.fromDate).toLocaleDateString()} to ${new Date(application.toDate).toLocaleDateString()}</p>
            <p><strong>Reason:</strong> ${application.reason}</p>
            <p><strong>Reviewed By:</strong> ${reviewerName}</p>
            ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
          </div>
          
          <p>${status === 'approved' 
            ? 'Your leave has been approved. Please ensure all necessary handover procedures are completed before your leave begins.' 
            : 'Your leave application has been rejected. Please contact your class teacher for more information if needed.'
          }</p>
          
          <div class="footer">
            <p>This is an automated notification from GVPCEW Leave Management System.</p>
            <p>For any queries, please contact the administration office.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWhatsAppMessage(data: NotificationData): string {
    const { student, application, status, reviewerName, comments } = data;
    
    const statusEmoji = status === 'approved' ? '✅' : '❌';
    const statusText = status === 'approved' ? 'APPROVED' : 'REJECTED';
    
    return `
${statusEmoji} *GVPCEW Leave Management*

Dear ${student.fullName},

Your leave application has been *${statusText}*

📅 *Leave Details:*
• Type: ${application.leaveType}
• Duration: ${new Date(application.fromDate).toLocaleDateString()} to ${new Date(application.toDate).toLocaleDateString()}
• Reviewed by: ${reviewerName}

${comments ? `💬 *Comments:* ${comments}` : ''}

${status === 'approved' 
  ? '✨ Please ensure all handover procedures are completed before your leave begins.' 
  : '📞 Please contact your class teacher for more information.'
}

---
*Gayatri Vidya Parishad College of Engineering for Women*
    `.trim();
  }

  // Future: Twilio WhatsApp integration
  /*
  private async sendTwilioWhatsApp(phoneNumber: string, message: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    
    if (!accountSid || !authToken || !whatsappNumber) {
      console.log('Twilio credentials not configured, skipping WhatsApp notification');
      return;
    }
    
    const client = require('twilio')(accountSid, authToken);
    
    await client.messages.create({
      body: message,
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${phoneNumber}`
    });
  }
  */
}

export const notificationService = new NotificationService();