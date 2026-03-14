# AI Fake News Detector — Mobile App

React Native + Expo mobile application for the AI Fake News Detector platform.

## Tech Stack
- **React Native** + **Expo** (SDK 51)
- **Expo Router** — file-based navigation
- **Axios** — API calls to the Vercel backend
- **Expo Image Picker** — camera & gallery access
- **Expo Secure Store** — secure token storage

## Backend
This app connects to the existing Next.js backend hosted on Vercel:
`https://ai-fake-news-detector01.vercel.app`

No backend changes required — all APIs are reused as-is.

## Features
- Login / Signup (credentials + Google OAuth)
- Analyze news: image upload, image URL, article URL, text
- Analysis results with confidence score, bias, tone, claims
- Analysis history
- Live news feed with one-tap analysis
- AI-generated quiz
- Personal dashboard with statistics
- User profile management

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone

### Install & Run
```bash
npm install
npx expo start
```
Scan the QR code with **Expo Go** on your phone.

### Build for Android (APK)
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

### Build for Google Play Store
```bash
eas build --platform android --profile production
eas submit --platform android
```

## Project Structure
```
app/
  _layout.jsx          # Root layout + AuthProvider
  result.jsx           # Analysis result screen
  (auth)/
    login.jsx          # Login screen
    signup.jsx         # Signup screen
  (tabs)/
    _layout.jsx        # Bottom tab navigation
    index.jsx          # Home / Analyze
    history.jsx        # Analysis history
    live.jsx           # Live news feed
    quiz.jsx           # News quiz
    dashboard.jsx      # User dashboard
    profile.jsx        # User profile
services/
  api.js               # All API calls to Vercel backend
  AuthContext.js       # Global authentication state
constants/
  theme.js             # Colors, spacing, border radius
```
