# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Primary Commands
- `npm start` or `expo start` - Start the Expo development server
- `npm run android` or `expo start --android` - Start for Android
- `npm run ios` or `expo start --ios` - Start for iOS  
- `npm run web` or `expo start --web` - Start for web

### Important Notes
- This is an Expo React Native project using Expo SDK ~53.0.17
- No test commands are currently configured in package.json
- No linting or type checking commands are configured
- Uses TypeScript with strict mode enabled

## Architecture Overview

### Tech Stack
- **Framework**: React Native with Expo
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation v7 (Stack + Bottom Tab)
- **State Management**: Zustand with persistence via AsyncStorage
- **UI**: Custom components with consistent theming system
- **AI Integration**: OpenAI API for voice transcription and food parsing
- **Audio**: Expo AV for voice recording

### Core Architecture Patterns

#### 1. Store-Based State Management
The app uses Zustand stores with persistence:
- `userStore.ts` - User profile, BMR/calorie calculations, onboarding state
- `foodStore.ts` - Food items, daily logs, nutrition tracking

#### 2. RevenueCat Context Provider Pattern
The app uses a React Context Provider for RevenueCat subscription management to ensure single state instance across all components:

**Key Files:**
- `src/contexts/RevenueCatContext.tsx` - Context provider and hook
- `src/hooks/useRevenueCat.ts` - Core RevenueCat logic (single instance)

**Architecture:**
```
App.tsx
├── RevenueCatProvider (single useRevenueCat hook instance)
│   ├── Context provides: { state, actions }
│   └── Handles: Initialization, listeners, state management
│
└── All Child Components
    ├── useRevenueCatContext() - Shared state access
    ├── VoiceScreen, SettingsScreen, PaywallScreen
    └── usePaywall hook
```

**Usage Pattern:**
```typescript
// ✅ CORRECT - Use context in components
import { useRevenueCatContext } from '../contexts/RevenueCatContext';
const { state, actions } = useRevenueCatContext();

// ❌ WRONG - Don't use direct hook (creates separate instance)
import useRevenueCat from '../hooks/useRevenueCat';
const { state, actions } = useRevenueCat();
```

**Benefits:**
- **Single Source of Truth**: All components share same subscription state
- **Automatic Initialization**: No manual retry buttons needed
- **Consistent Updates**: State changes propagate to all components
- **Prevents Race Conditions**: Only one initialization process

#### 3. Navigation Structure
- **Root Stack**: Conditional rendering based on onboarding completion
- **Tab Navigator**: Main app with Home, Voice, History, Settings tabs
- Navigation types defined in `src/types/index.ts`

#### 4. Component Organization
```
src/
├── components/
│   ├── charts/         # Data visualization components
│   ├── forms/          # Form-related components  
│   └── ui/             # Reusable UI components (Button, Card, Input, etc.)
├── constants/
│   └── theme.ts        # Comprehensive design system
├── navigation/
│   └── AppNavigator.tsx # Navigation configuration
├── screens/            # Screen components organized by feature
├── services/           # External service integrations
├── stores/             # Zustand state management
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

#### 5. Design System
- Centralized theme in `src/constants/theme.ts`
- Consistent color palette, typography, spacing, shadows
- Component-specific styling constants
- Support for gradients and Material Design icons

### Key Features & Integrations

#### Voice-to-Food Parsing
- Records audio using Expo AV
- Transcribes via OpenAI Whisper API
- Parses food items using GPT-4o-mini with Egyptian food context
- Handles quantity clarification and cooking method detection

#### Nutrition Calculations
- BMR calculation using Mifflin-St Jeor Equation
- Activity level multipliers for TDEE
- Macro distribution (30% protein, 45% carbs, 25% fat)
- Real-time progress tracking

#### Data Persistence
- All user data persisted via AsyncStorage
- Zustand middleware handles serialization
- Food logs organized by date (YYYY-MM-DD format)

#### Subscription Management
- **FREE Tier**: 10 voice recordings per month
- **PRO Tier**: 300 voice recordings per month
- Monthly limits reset on the 1st of each month
- Subscription state managed via RevenueCat context provider
- Real-time limit enforcement with usage progress tracking

### Environment Variables

#### Correct .env Configuration
The project uses a robust multi-source fallback system for environment variables. For proper functionality across development and production builds, configure your `.env` file as follows:

```env
# Both variables should contain the same API key value
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

**Important**: 
- Both variables must contain identical values
- The `.env` file should never be committed to version control
- Add `.env` to your `.gitignore` file

#### How Environment Variable Loading Works

The app uses a sophisticated fallback system in `src/config/env.ts`:

1. **Development Environment**: Loads `process.env.OPENAI_API_KEY` directly from `.env` file
2. **iOS Production Builds**: Falls back to `Constants.expoConfig?.extra?.OPENAI_API_KEY` via `app.config.js`
3. **Legacy Compatibility**: Additional fallbacks to manifest sources for older Expo versions

#### Configuration Files

**app.config.js** passes environment variables to builds:
```javascript
extra: {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  // ... other config
}
```

**eas.json** uses basic production configuration - no explicit environment variables needed:
```json
"production": {
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### Troubleshooting Environment Variables

- Check console logs for detailed environment variable debugging information
- Ensure `.env` file is in the project root directory
- Verify both `OPENAI_API_KEY` and `EXPO_PUBLIC_OPENAI_API_KEY` are present with identical values

#### Do NOT:
- Use only `EXPO_PUBLIC_` prefixed variables for sensitive API keys (they're visible in compiled apps)
- Modify the existing fallback system in `src/config/env.ts` without thorough testing
- Remove either variable from `.env` - both are needed for cross-environment compatibility

### Code Conventions
- TypeScript strict mode enabled
- React functional components with hooks
- Zustand stores follow consistent patterns with actions and selectors
- UI components implement prop interfaces from types
- Consistent file naming: PascalCase for components, camelCase for utilities

### RTL (Right-to-Left) Support - CRITICAL RULES

The app is fully bilingual (English/Arabic) with RTL support. **ALWAYS follow these rules when making UI changes:**

#### Bottom-Up Approach (CRITICAL)
**ALWAYS fix base UI components FIRST, then screens will inherit correct RTL behavior automatically.**

#### RTL Implementation Checklist

1. **Base UI Components MUST Have RTL Support** (Do This FIRST):
   ```typescript
   // In EVERY reusable component that renders text (Input, Button, Card, etc.):
   import { useRTLStyles } from '../../utils/rtl';

   export const MyComponent = () => {
     const { rtlText, rtlRow } = useRTLStyles();

     return (
       <>
         <Text style={[styles.text, rtlText]}>{text}</Text>
         <View style={[styles.row, rtlRow]}>...</View>
       </>
     );
   };
   ```

2. **Screen-Level RTL** (Do This SECOND):
   - Headers with horizontal layouts
   - Navigation button groups
   - Action button containers
   - Any row-based layouts

3. **Required RTL Utilities** (`src/utils/rtl.ts`):
   - `rtlText` - Apply to ALL Text components for proper alignment
   - `rtlRow` - Apply to ALL flexDirection: 'row' containers
   - `rtlIcon()` - Use for directional icons (arrows, chevrons)
   - `rtlMarginRight()`, `rtlMarginLeft()` - For directional spacing
   - `rtlPaddingRight()`, `rtlPaddingLeft()` - For directional padding

4. **Common Mistake to AVOID**:
   ```typescript
   // ❌ WRONG - Only adding RTL to screens
   <Text style={styles.label}>{label}</Text>  // In Input component
   <Text style={[styles.text, rtlText]}>{t('key')}</Text>  // In screen

   // ✅ CORRECT - Add RTL to base component
   <Text style={[styles.label, rtlText]}>{label}</Text>  // In Input component
   <Text style={[styles.text, rtlText]}>{t('key')}</Text>  // In screen
   ```

5. **When to Use Each Utility**:
   - `rtlText`: ALL Text and TextInput components
   - `rtlRow`: Containers with `flexDirection: 'row'` that have multiple children
   - `rtlIcon()`: Arrow icons (arrow-back/arrow-forward, chevron-left/chevron-right)
   - Margin/Padding: When elements need directional spacing

6. **Translation Requirements**:
   - All user-facing text must use `t('key')` from `useTranslation()`
   - Add keys to both `src/localization/locales/en.ts` and `ar.ts`
   - Validate helpers for constants (ActivityLevel, Goal, etc.) that need translation

#### RTL Testing Checklist
Before committing RTL changes, verify:
- [ ] All Text components have `rtlText` styling
- [ ] All row containers have `rtlRow` styling
- [ ] Directional icons flip correctly (arrows, chevrons)
- [ ] Button groups reverse order in RTL
- [ ] Headers reverse layout (back button, title, actions)
- [ ] Base UI components (Input, Button, etc.) have built-in RTL support

### Critical Development Rules

#### Native Module Safety
- **NEVER** import native modules at the top level of components
- Always use dynamic imports: `await import('expo-audio')`
- Implement proper lazy loading to prevent crashes on component mount
- Check Platform.OS before using platform-specific APIs

#### Hook Usage Rules (CRITICAL)
- React hooks can ONLY be called at the top level of components
- **NEVER** call hooks inside callbacks, conditions, or loops
- If you need dynamic behavior, use useRef and state management instead
- When refactoring from hooks to non-hook patterns, ensure no hook violations remain

#### Expo Audio v14 Specific Patterns
- **No Direct Constructors**: Never use `new Recording()` or `new AudioRecorder()`
- **Hook-Only API**: Use `useAudioRecorder()` and `useAudioRecorderState()`
- **Component-Level Hooks**: Hooks must be called at component top level
- **Built-in State**: Use `recorderState.isRecording`, `recorderState.currentTime`
- **Automatic Cleanup**: Hooks handle cleanup automatically

#### Error Handling Requirements
- Every external API call must be wrapped in try-catch
- Provide meaningful error messages that help diagnose issues
- Never suppress errors - always log them with context
- Implement graceful fallbacks when native features fail

### Common Development Patterns

#### Adding New Screens
1. Create screen component in appropriate `src/screens/` subfolder
2. Add navigation types to `src/types/index.ts`
3. Register in `AppNavigator.tsx`

#### Adding UI Components
1. Create in `src/components/ui/`
2. Define props interface in `src/types/index.ts`
3. Follow theme system patterns from existing components
4. Export from `src/components/ui/index.ts`

#### State Management
- Use Zustand stores for shared state
- Implement persistence for data that should survive app restarts
- Follow existing patterns for calculated fields (BMR, daily calories)

### Platform-Specific Notes
- Uses Expo managed workflow
- Audio recording requires microphone permissions (configured in app.json)
- Icons use @expo/vector-icons MaterialIcons
- Gradients implemented with expo-linear-gradient

## Deployment Configuration

### EAS Build & Submit
- Configured for EAS builds with `eas.json`
- EAS CLI version >=16.17.0 required
- Project configured with EAS project ID: `48562b4c-cb8e-436a-90e5-9065e0bcdb4a`
- Owner: `basimdcs`

### iOS App Store / TestFlight
- Bundle ID: `com.basimdcs.calorietracker`
- Production builds configured for App Store distribution
- Auto-incrementing build numbers enabled
- Required permissions configured:
  - Microphone access for voice recording
  - Camera access for meal photos
  - Photo library access for selecting images
- Non-exempt encryption declaration: false

### Build Profiles
- **Development**: Development client with internal distribution
- **Preview**: Internal distribution for testing
- **Production**: App Store distribution with auto-increment

### Deployment Commands
- `eas build --platform ios --profile production` - Build for App Store
- `eas submit --platform ios` - Submit to App Store Connect/TestFlight
- Requires Apple Developer Account authentication during build process