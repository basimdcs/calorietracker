# RevenueCat API Key Setup Guide

## 🚨 **Current Issue**
You're getting the error: `"Invalid API key. Use your Web Billing or Paddle API key."`

This means you're using the **wrong type of API key**. You need the **Public API Key** from RevenueCat, not a Web Billing or Paddle key.

## 🔑 **How to Get the Correct API Keys**

### Step 1: Log into RevenueCat Dashboard
1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Sign in to your account

### Step 2: Find Your Public API Keys
1. Navigate to your **Project**
2. Go to **Project Settings** → **API Keys**
3. You'll see two types of keys:
   - **Public API Keys** (what you need) - starts with `appl_` for iOS, `goog_` for Android
   - **Secret API Keys** (for server-side) - starts with `sk_`

### Step 3: Copy the Correct Keys
- **iOS Public API Key**: Starts with `appl_` (e.g., `appl_yQRNC...`)
- **Android Public API Key**: Starts with `goog_` (e.g., `goog_...`)

## 📝 **Environment Setup**

### Option 1: Using .env file (Recommended for Development)
Create a `.env` file in your project root:

```bash
# RevenueCat Public API Keys (NOT Web Billing or Paddle keys)
REVENUE_CAT_API_KEY_IOS=appl_your_ios_public_key_here
REVENUE_CAT_API_KEY_ANDROID=goog_your_android_public_key_here

# Other API keys
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here
```

### Option 2: Using EAS Secrets (Recommended for Production)
```bash
# Set secrets for your EAS project
eas secret:create --scope project --name REVENUE_CAT_API_KEY_IOS --value "appl_your_ios_public_key_here"
eas secret:create --scope project --name REVENUE_CAT_API_KEY_ANDROID --value "goog_your_android_public_key_here"
```

### Option 3: Direct in app.config.js (Not recommended for production)
```javascript
extra: {
  REVENUE_CAT_API_KEY_IOS: "appl_your_ios_public_key_here",
  REVENUE_CAT_API_KEY_ANDROID: "goog_your_android_public_key_here",
}
```

## 🔍 **API Key Validation**

The app now validates API keys automatically:

### iOS Keys
- ✅ Must start with `appl_`
- ✅ Must be at least 20 characters long
- ✅ Example: `appl_yQRNC1234567890abcdefghijklmnop`

### Android Keys
- ✅ Must start with `goog_`
- ✅ Must be at least 20 characters long
- ✅ Example: `goog_1234567890abcdefghijklmnop`

## 🚫 **Common Mistakes to Avoid**

1. **Using Secret API Keys** (`sk_` prefix) instead of Public API Keys
2. **Using Web Billing or Paddle API Keys** (these are for different services)
3. **Using API Keys from wrong project** (make sure you're in the correct RevenueCat project)
4. **Using placeholder values** like `"your-ios-api-key-here"`

## 🧪 **Testing Your Setup**

### 1. Check API Key Format
The app will log the key format validation:
```
🔑 Using RevenueCat API key: {
  platform: "ios",
  keyPreview: "appl_yQRNC...",
  keyLength: 32
}
```

### 2. Successful Initialization
You should see:
```
✅ RevenueCat configured successfully
✅ RevenueCat initialized successfully
```

### 3. Error Messages
If you still get errors, check:
- Key format validation messages
- Network connectivity
- RevenueCat project configuration

## 📱 **Platform-Specific Setup**

### iOS Setup
1. Ensure your iOS bundle ID matches RevenueCat project
2. Configure App Store Connect products
3. Link products in RevenueCat dashboard

### Android Setup
1. Ensure your Android package name matches RevenueCat project
2. Configure Google Play Console products
3. Link products in RevenueCat dashboard

## 🔧 **Troubleshooting**

### If you still get "Invalid API key" error:
1. **Double-check the key prefix**: iOS should be `appl_`, Android should be `goog_`
2. **Verify project selection**: Make sure you're using keys from the correct RevenueCat project
3. **Check bundle ID/package name**: Ensure they match between your app and RevenueCat project
4. **Clear app cache**: Sometimes cached configurations can cause issues

### If initialization fails:
1. **Check network connectivity**
2. **Verify RevenueCat project is active**
3. **Ensure products are configured in RevenueCat dashboard**
4. **Check app store configuration**

## 📞 **Getting Help**

1. **RevenueCat Documentation**: [https://docs.revenuecat.com/](https://docs.revenuecat.com/)
2. **RevenueCat Community**: [https://community.revenuecat.com/](https://community.revenuecat.com/)
3. **API Key Guide**: [https://docs.revenuecat.com/docs/api-keys](https://docs.revenuecat.com/docs/api-keys)

---

**Remember**: Always use **Public API Keys** (starts with `appl_` or `goog_`), never Secret API Keys or Web Billing keys! 