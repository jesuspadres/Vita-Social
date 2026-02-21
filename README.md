# Vita Social

**"The bridge from the screen to the scene."**

Vita is a mobile social connection platform built with React Native and Expo. It facilitates real-world meetups through swipe-based discovery, community groups with health-ring accountability, location-based events with GPS check-in, and real-time messaging.

## Tech Stack

- **Expo SDK 54** + Expo Router (file-based routing)
- **React Native** (iOS, Android, Web)
- **TypeScript** (strict mode)
- **NativeWind v4** (Tailwind CSS for React Native)
- **React Native Reanimated** + Gesture Handler (animations & gestures)
- **Zustand** (state management)
- **Supabase** (backend, auth, realtime)
- **lucide-react-native** (icons)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app on your phone, or iOS Simulator / Android Emulator

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd vita-social

# Install dependencies
npm install

# Start the dev server
npx expo start
```

### Running on Device

1. Install **Expo Go** from the App Store or Google Play
2. Run `npx expo start`
3. Scan the QR code with your phone camera (iOS) or Expo Go (Android)

### Running on Simulator/Emulator

```bash
# iOS Simulator (macOS only, requires Xcode)
npx expo start --ios

# Android Emulator (requires Android Studio)
npx expo start --android

# Web browser
npx expo start --web
```

## Environment Variables

Create a `.env.local` file in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The app works fully offline with mock data when these variables are not set.

## Project Structure

```
src/
  app/                  # Expo Router screens and layouts
    (auth)/             # Login, verify, onboarding
    (main)/(tabs)/      # Discover, map, groups, messages, profile
  components/           # Reusable UI components
    ui/                 # Primitives (Button, Card, Avatar, etc.)
    discover/           # SwipeDeck, ProfileCard, LikesYou
    map/                # EventPin, EventDetailSheet, etc.
    groups/             # GroupCard, GroupDetail, etc.
    messages/           # ChatThread, ConversationRow, etc.
    profile/            # EditProfileSheet, SettingsPage, etc.
  lib/                  # Utilities, constants, mock data
  stores/               # Zustand state stores
  types/                # TypeScript type definitions
```

## EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## License

Private - All rights reserved.
