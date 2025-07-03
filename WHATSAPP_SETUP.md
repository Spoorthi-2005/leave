# WhatsApp Notifications Setup Guide

## Current Status
The system currently uses a **Mock WhatsApp Service** that logs messages to console. This allows testing and development without requiring actual WhatsApp integration.

## Upgrading to Real WhatsApp Service

### Option 1: WhatsApp Web API (Free - Recommended for Development)

1. **Update the WhatsApp Service** (`server/whatsapp-service.ts`):
   ```bash
   npm install whatsapp-web.js@latest qrcode-terminal
   ```

2. **Replace the mock service** with the original WhatsApp Web implementation
3. **Scan QR Code** when server starts to authenticate
4. **Limitations**: Requires keeping browser session active

### Option 2: Twilio WhatsApp Business API (Paid - Recommended for Production)

1. **Create Twilio Account**: Visit [twilio.com](https://twilio.com)
2. **Set up WhatsApp Business**: Configure WhatsApp Business API
3. **Get Credentials**:
   - Account SID
   - Auth Token  
   - WhatsApp Phone Number

4. **Add Environment Variables**:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_whatsapp_number
   ```

5. **Install Twilio SDK**:
   ```bash
   npm install twilio
   ```

6. **Update WhatsApp Service**:
   ```typescript
   import twilio from 'twilio';
   
   const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
   
   async sendMessage(phoneNumber: string, message: string) {
     await client.messages.create({
       from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
       to: `whatsapp:${phoneNumber}`,
       body: message
     });
   }
   ```

### Option 3: Other WhatsApp APIs

- **WhatsApp Cloud API** (Meta/Facebook official)
- **360Dialog** (WhatsApp Business Solution Provider)
- **MessageBird** (Omnichannel API platform)

## Message Format

The system sends professional messages with:
- ✅/❌ Status indicators
- GVPCEW branding
- Complete application details
- Reviewer information
- Actionable guidance

Example approved message:
```
🏫 *GVPCEW Leave Management System*

✅ *Leave Application APPROVED*

👤 *Student:* Jane Doe
📅 *Leave Type:* emergency
🗓️ *Duration:* 9 days (Feb 20 - Feb 28, 2025)

👨‍💼 *Reviewed by:* Dr PVSL Jagadamba
💬 *Comments:* Emergency medical situation approved...

✨ Your leave application has been approved...

📱 *Gayatri Vidya Parishad College of Engineering for Women*
```

## Testing the Current Mock Service

1. **Submit Leave Application** (>5 days as student)
2. **Login as HOD** and approve/reject
3. **Check Console Logs** for WhatsApp message output
4. **Verify Message Format** and content accuracy

## Production Deployment

For production use:
1. Choose Option 2 (Twilio) for reliability
2. Set up proper error handling
3. Add message delivery confirmation
4. Implement retry logic for failed sends
5. Add rate limiting to prevent spam

## Support

The current mock implementation allows full testing of the notification workflow without requiring external services. When ready for production, simply replace the mock service with your chosen WhatsApp provider.