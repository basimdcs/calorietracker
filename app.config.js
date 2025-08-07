export default {
  expo: {
    name: "Kam Calorie - AI Calories Tracker",
    slug: "calorie-tracker",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./KamCalorie_Icons_iOS_v2/AppIcon_Primary.appiconset/KamCalorie_Default_AppStore_1024.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./KamCalorie_Icons_iOS_v2/AppIcon_Primary.appiconset/KamCalorie_Default_AppStore_1024.png",
      resizeMode: "contain",
      backgroundColor: "#4CAF50"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.basimdcs.calorietracker",
      buildNumber: "20",
      icon: {
        "20x20": "./KamCalorie_Icons_iOS_v2/AppIcon_Primary.appiconset/KamCalorie_Default_iphone_20x20_2x.png",
        "29x29": "./KamCalorie_Icons_iOS_v2/AppIcon_Primary.appiconset/KamCalorie_Default_iphone_29x29_2x.png",
        "40x40": "./KamCalorie_Icons_iOS_v2/AppIcon_Primary.appiconset/KamCalorie_Default_iphone_40x40_2x.png",
        "60x60": "./KamCalorie_Icons_iOS_v2/AppIcon_Primary.appiconset/KamCalorie_Default_iphone_60x60_2x.png",
        "76x76": "./KamCalorie_Icons_iOS_v2/AppIcon_Primary.appiconset/KamCalorie_Default_ipad_76x76_1x.png",
        "83.5x83.5": "./KamCalorie_Icons_iOS_v2/AppIcon_Primary.appiconset/KamCalorie_Default_ipad_83.5x83.5_2x.png",
        "1024x1024": "./KamCalorie_Icons_iOS_v2/AppIcon_Primary.appiconset/KamCalorie_Default_AppStore_1024.png"
      },
      infoPlist: {
        NSMicrophoneUsageDescription: "Kam Calorie needs access to your microphone to record voice descriptions of your meals for easy food logging.",
        NSCameraUsageDescription: "Kam Calorie needs access to your camera to take photos of your meals for food logging.",
        NSPhotoLibraryUsageDescription: "Kam Calorie needs access to your photo library to select meal photos for food logging.",
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.basimdcs.calorietracker",
      versionCode: 1,
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      // Pass environment variables to the app
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      REVENUE_CAT_API_KEY_IOS: process.env.REVENUE_CAT_API_KEY_IOS,
      REVENUE_CAT_API_KEY_ANDROID: process.env.REVENUE_CAT_API_KEY_ANDROID,
      // Also pass EXPO_PUBLIC versions as fallback
      EXPO_PUBLIC_REVENUE_CAT_API_KEY_IOS: process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_IOS,
      EXPO_PUBLIC_REVENUE_CAT_API_KEY_ANDROID: process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY_ANDROID,
      eas: {
        projectId: "48562b4c-cb8e-436a-90e5-9065e0bcdb4a"
      }
    },
    plugins: [
      [
        "expo-audio",
        {
          microphonePermission: "Kam Calorie needs access to your microphone to record voice descriptions of your meals for easy food logging."
        }
      ],
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "15.1"
          }
        }
      ]
    ],
    owner: "basimdcs"
  },
}; 