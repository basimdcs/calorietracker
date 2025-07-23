# Voice Recording Setup Guide

## Issue: "Failed to process recording. Please try again."

The voice recording feature requires an OpenAI API key to transcribe speech and parse food information.

## Quick Fix

### 1. Get an OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the API key

### 2. Configure the API Key

#### Option A: Environment Variable (Recommended)
Create a `.env` file in your project root:

```bash
EXPO_PUBLIC_OPENAI_API_KEY=your_actual_api_key_here
```

#### Option B: Direct Configuration (Temporary)
Edit `src/services/openai.ts` and replace line 3:

```typescript
const OPENAI_API_KEY = 'your_actual_api_key_here';
```

### 3. Restart the App
After adding the API key, restart your development server:

```bash
npx expo start --clear
```

## How Voice Recording Works

1. **Record Audio**: App records your voice describing food
2. **Transcribe**: OpenAI Whisper converts speech to text
3. **Parse Food**: GPT-4 analyzes text to extract food items and nutrition
4. **Review**: You can edit the detected foods before logging

## Troubleshooting

### Common Errors:
- **"API key is not configured"**: Follow the setup steps above
- **"No speech detected"**: Speak more clearly or check microphone permissions
- **"Network error"**: Check your internet connection
- **"Rate limit exceeded"**: Wait a few minutes and try again

### Microphone Permissions:
Make sure the app has microphone permission:
- iOS: Settings > Privacy & Security > Microphone > CalorieTracker
- Android: Settings > Apps > CalorieTracker > Permissions > Microphone

## Cost Information

- **Whisper API**: ~$0.006 per minute of audio
- **GPT-4 API**: ~$0.01-0.03 per request
- **Typical cost**: ~$0.02-0.05 per voice log

## Support

If you continue having issues, please contact support with:
1. The exact error message
2. Your device type (iOS/Android)
3. Whether you're using a simulator or real device 