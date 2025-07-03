# Twilio WhatsApp Setup Troubleshooting

## Current Issue: Authentication Error 20003

**Error:** "Authentication Error - invalid username"
**Code:** 20003

## Possible Solutions

### 1. Verify Credentials Format
- **Account SID**: Must start with "AC" followed by 32 characters
- **Auth Token**: 32-character string
- **Phone Number**: Format +14155238886

### 2. Check for Hidden Characters
- Copy credentials directly from Twilio Console
- Avoid copy-pasting from emails or other sources
- Ensure no extra spaces or line breaks

### 3. Account Status Verification
- Verify your Twilio account is active
- Check if trial account needs phone verification
- Ensure WhatsApp sandbox is properly configured

### 4. Test Credentials Manually
You can test your credentials using curl:

```bash
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID.json" \
  -u YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN
```

### 5. Alternative Testing
If credentials continue to fail, you can test WhatsApp messaging directly from Twilio Console:
1. Go to Messaging → Try WhatsApp
2. Send a test message to your own number
3. Verify the sandbox is working

## Current System Status
- WhatsApp notification system is fully implemented
- Professional message formatting ready
- Graceful fallback to console logging when Twilio fails
- System will automatically switch to real WhatsApp once authentication works

## Next Steps
1. Verify Account SID and Auth Token from Twilio Console
2. Update Replit secrets with correct values
3. Restart the application
4. Test leave application workflow

The leave management system is ready - once Twilio authenticates properly, users will receive real WhatsApp notifications for leave approvals and rejections.