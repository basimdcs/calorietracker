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

#### 2. Navigation Structure
- **Root Stack**: Conditional rendering based on onboarding completion
- **Tab Navigator**: Main app with Home, Voice, History, Settings tabs
- Navigation types defined in `src/types/index.ts`

#### 3. Component Organization
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

#### 4. Design System
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

### Environment Variables
- `EXPO_PUBLIC_OPENAI_API_KEY` - Required for OpenAI service integration
- Environment variables should be stored in `.env` file (not committed)

### Code Conventions
- TypeScript strict mode enabled
- React functional components with hooks
- Zustand stores follow consistent patterns with actions and selectors
- UI components implement prop interfaces from types
- Consistent file naming: PascalCase for components, camelCase for utilities

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