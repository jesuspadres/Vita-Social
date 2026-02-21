# Vita -- Development Guide

## Project Overview

Vita is a social connection platform designed to facilitate real-world meetups.
Think of it as a Tinder/Meetup hybrid that prioritizes moving people from screens
to in-person experiences. The core tagline is: **"The bridge from the screen to the scene."**

Key features:
- **Discovery** -- Swipe-based matching (like, pass, super-like)
- **Groups** -- Community groups with a health-ring system that rewards real attendance
- **Events** -- Location-based events with GPS check-in verification
- **Messaging** -- Real-time chat between matched users
- **Map** -- Discover nearby events and groups on an interactive map

## Tech Stack

| Layer          | Technology                                       |
| -------------- | ------------------------------------------------ |
| Framework      | Expo SDK 54 + Expo Router (file-based routing)   |
| Language       | TypeScript (strict mode)                         |
| Platform       | React Native (iOS + Android + Web)               |
| Backend / Auth | Supabase (Postgres, Auth, Realtime)              |
| Styling        | NativeWind v4 (Tailwind CSS for React Native)    |
| State          | Zustand                                          |
| Animations     | React Native Reanimated + Gesture Handler        |
| Icons          | lucide-react-native                              |
| Date Utilities | date-fns                                         |
| Haptics        | expo-haptics                                     |
| SVG            | react-native-svg                                 |
| Fonts          | @expo-google-fonts/inter                         |

## Directory Structure

```
src/
  app/
    _layout.tsx              # Root layout (fonts, providers, splash)
    index.tsx                # Redirect to /discover
    +not-found.tsx
    (auth)/
      _layout.tsx            # Auth stack (no tabs)
      login.tsx
      verify.tsx
      onboarding.tsx
    (main)/
      _layout.tsx
      (tabs)/
        _layout.tsx          # Bottom tab navigator
        discover.tsx
        map.tsx
        groups.tsx
        messages.tsx
        profile.tsx
  components/
    ui/                      # Primitives: button, card, avatar, badge, input,
                             # health-ring, modal, toast, toast-provider,
                             # empty-state, skeleton, error-boundary
    discover/                # SwipeDeck, ProfileCard, LikesYou
    map/                     # EventPin, EventDetailSheet, CreateEventSheet, CheckInSuccess
    groups/                  # GroupCard, GroupDetail, GroupFeedPost,
                             # CreateGroupSheet, HealthWarningBanner
    messages/                # ConversationRow, ChatThread, MessageBubble, AiIcebreaker
    profile/                 # EditProfileSheet, VerificationCard, SettingsPage, GoldUpsell
    providers.tsx            # App-wide providers wrapper
  lib/
    constants.ts             # App-wide constants (colors, thresholds, limits)
    utils.ts                 # cn() utility for NativeWind class merging
    haptics.ts               # expo-haptics wrapper
    mock-data.ts             # All mock data (app works fully offline)
    supabase/
      client.ts              # Supabase client with SecureStore adapter
  stores/
    auth-store.ts            # Zustand store -- authentication state
    app-store.ts             # Zustand store -- global UI state
  hooks/
    use-toast.ts             # Zustand-based toast notification store
  types/
    database.ts              # TypeScript types mirroring the Supabase schema
  global.css                 # NativeWind base styles (@tailwind directives)
assets/                      # App icons, splash screen assets
```

## Design System

Vita follows a **Swiss-design** inspired aesthetic -- clean, precise, generous
whitespace, strong typography hierarchy.

### Typography
- **Primary font:** Inter (via @expo-google-fonts/inter)
- Variants: Regular (400), Medium (500), SemiBold (600), Bold (700)

### Color Palette

| Token      | Hex       | Usage                       |
| ---------- | --------- | --------------------------- |
| Primary    | `#1A365D` | Headers, CTAs, nav          |
| Secondary  | `#4A90A4` | Accents, links, info states |
| Success    | `#38A169` | Positive actions, check-ins |
| Warning    | `#D69E2E` | Alerts, health ring yellow  |
| Danger     | `#E53E3E` | Errors, destructive actions |
| Blue Badge | `#3182CE` | Verification badge          |
| Gold Badge | `#D4AF37` | Premium badge               |

### Health Ring Colors
- **Green** (1-30 days) -- Active member
- **Yellow** (31-37 days) -- Cooling off
- **Orange** (38-42 days) -- At risk
- **Red** (43-45 days) -- Critical
- **Gray** (46+ days) -- Inactive / expired

## Key Commands

```bash
# Install dependencies
npm install

# Start the Expo dev server
npx expo start

# Start for specific platform
npx expo start --ios
npx expo start --android
npx expo start --web

# Build with EAS
eas build --platform ios
eas build --platform android

# Lint the codebase
npm run lint
```

## Environment Variables

Create a `.env.local` file with:

- `EXPO_PUBLIC_SUPABASE_URL` -- Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` -- Your Supabase anonymous/public key

Note: The app works without these variables using mock data.

## Conventions

- All components are client-side (no server components in React Native).
- Use Expo Router file-based routing (`_layout.tsx` for layouts, screen files for pages).
- Use NativeWind `className` for styling; use inline `style={{}}` for shadows and complex transforms.
- Use `<LinearGradient>` from expo-linear-gradient instead of CSS gradients.
- Use React Native Reanimated for animations (not Framer Motion).
- Use React Native Gesture Handler for gestures.
- Shared components go in `src/components/`.
- Use the `cn()` utility from `@/lib/utils` for conditional class merging.
- All Supabase queries should go through the typed client in `@/lib/supabase/client.ts`.
- Prefer named exports over default exports.
- Use `date-fns` for date formatting and calculations.
- Use `expo-haptics` (via `@/lib/haptics`) for tactile feedback.
- Path alias: `@/*` maps to `./src/*`.

## React Native Patterns

### Replacing Web Patterns
| Web (old)             | React Native (current)                     |
| --------------------- | ------------------------------------------ |
| `div`                 | `View`                                     |
| `span`, `p`, `h1`    | `Text`                                     |
| `img`                 | `Image`                                    |
| `button`              | `Pressable`                                |
| `input`               | `TextInput`                                |
| `motion.div`          | `Animated.View` (Reanimated)               |
| `backdrop-blur`       | `<BlurView>` (expo-blur)                   |
| `bg-gradient-to-*`    | `<LinearGradient>` (expo-linear-gradient)  |
| CSS box-shadow        | `style={{ shadowColor, shadowOffset, ... }}` + `elevation` |
| `grid-cols-*`         | `FlatList numColumns` or `flexWrap`        |
| `line-clamp-*`        | `<Text numberOfLines={N}>`                 |
| `:hover`              | N/A (no hover on mobile)                   |
| `sessionStorage`      | `expo-secure-store`                        |
| `next/navigation`     | `expo-router`                              |
