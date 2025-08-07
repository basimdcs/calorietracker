# RevenueCat Debug Steps

## 🔍 **Current Status**
- iOS Key: `appl_yQRNCcadOsqelvifYWdQOwoHaHZ` ✅ (format looks correct)
- Android Key: `your-android-api-key-here` ❌ (still placeholder)
- Error: "Invalid API key. Use your Web Billing or Paddle API key"

## 🚨 **Immediate Actions Required**

### 1. **Restart Development Server**
```bash
# Stop current server (Ctrl+C)
npx expo start --clear
```

### 2. **Verify iOS Key Completeness**
Your current iOS key seems short. A typical RevenueCat public API key should be ~40+ characters.

**Check in RevenueCat Dashboard:**
1. Go to https://app.revenuecat.com/
2. Navigate to Project Settings → API Keys
3. Copy the **Public API Key** for iOS
4. It should look like: `appl_yQRNCcadOsqelvifYWdQOwoHaHZ...` (much longer)

### 3. **Get Android Key**
You still have the placeholder. Get the Android public API key:
1. In RevenueCat Dashboard → Project Settings → API Keys
2. Copy the **Public API Key** for Android
3. It should start with `goog_`

### 4. **Update .env File**
```bash
# Replace with your actual complete keys
REVENUE_CAT_API_KEY_IOS=appl_your_complete_ios_key_here
REVENUE_CAT_API_KEY_ANDROID=goog_your_complete_android_key_here
```

### 5. **Verify Project Configuration**
Ensure your RevenueCat project has:
- ✅ Bundle ID: `com.basimdcs.calorietracker`
- ✅ Package Name: `com.basimdcs.calorietracker`
- ✅ Products configured and linked

## 🔧 **Alternative: Use EAS Secrets**
If .env file isn't working:

```bash
# Set secrets for your EAS project
eas secret:create --scope project --name REVENUE_CAT_API_KEY_IOS --value "appl_your_complete_ios_key_here"
eas secret:create --scope project --name REVENUE_CAT_API_KEY_ANDROID --value "goog_your_complete_android_key_here"
```

## 📱 **Test Steps**
1. Restart server with `npx expo start --clear`
2. Check console logs for the new debug information
3. Look for successful initialization messages
4. Test purchase flow

## 🚫 **Common Issues**
- **Key too short**: RevenueCat keys should be ~40+ characters
- **Wrong project**: Ensure you're using keys from the correct RevenueCat project
- **Bundle ID mismatch**: Verify bundle ID matches between app and RevenueCat
- **Cached configuration**: Clear cache and restart server 