# Africa's Talking API Setup Guide

## Getting Your API Credentials

1. Go to [Africa's Talking](https://africastalking.com/) and create an account if you don't have one
2. Log into your Africa's Talking dashboard
3. Navigate to "Settings" > "API Key" to generate your API key
4. Note your username (usually your login email/username)

## Required Configuration

You need to update the following environment variables:

### For Backend (call-center-api/.env):
```
AT_USERNAME=your_actual_username
AT_API_KEY=your_actual_api_key
AT_SANDBOX=false  # Set to true only for testing with sandbox
```

### For Frontend (.env.local):
```
NEXT_PUBLIC_AT_USERNAME=your_actual_username
NEXT_PUBLIC_AT_API_KEY=your_actual_api_key
NEXT_PUBLIC_AT_SANDBOX=false
```

## Phone Number Setup

If using production (not sandbox), ensure your phone numbers are properly configured:

1. Purchase voice-enabled phone numbers from Africa's Talking
2. Add them to your environment:
```
AT_PHONE_NUMBERS=+254700000000,+254700000001
```

## Sandbox vs Production Mode

- **Sandbox Mode**: Use for testing. Free but limited to test numbers.
- **Production Mode**: For real calls. Requires account balance and activated voice service.

## Testing the Integration

1. Make sure your account has voice calling enabled
2. Verify you have sufficient account balance for production
3. Test with properly formatted international numbers (e.g., +254700000000)

## Common Issues & Solutions

### 400 Bad Request Errors
- Verify API credentials are correct
- Ensure you're using the right endpoint (sandbox vs production)
- Check phone number formatting: must be in international format (+XX)
- Confirm your account has voice service activated

### Authentication Errors
- Double-check your API key and username
- Ensure no extra spaces in the .env file values
- Regenerate API keys if they might be compromised

### Phone Number Issues
- Make sure numbers are in international format (+254700000000)
- Verify your account has access to the specified phone numbers
- For sandbox, use test phone numbers provided by Africa's Talking