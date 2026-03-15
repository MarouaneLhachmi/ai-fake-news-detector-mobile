# AI Fake News Detector — Mobile App (SDK 53)

React Native + Expo mobile application for the AI Fake News Detector platform.

## Tech Stack
- **React Native** + **Expo SDK 53**
- **Expo Router 4** — file-based navigation
- **Axios** — API calls to the Vercel backend
- **Expo Image Picker** — camera & gallery access
- **Expo Secure Store** — secure token storage

## Backend
`https://ai-fake-news-detector01.vercel.app`

---

## All Bugs Fixed (SDK 53 + Runtime)

### SDK 53 compatibility fixes
| # | File | Problem | Fix |
|---|------|---------|-----|
| 1 | `services/AuthContext.js` | Import circulaire `../services/api` | → `./api` |
| 2 | `app/(tabs)/index.jsx` | `MediaTypeOptions.Images` déprécié | → `'images'` |
| 3 | `app/_layout.jsx` | `GestureHandlerRootView` sans dépendance | → Supprimé |
| 4 | `babel.config.js` | Plugin reanimated sans lib | → Supprimé |
| 5 | `app.json` | Manque `newArchEnabled: true` | → Ajouté |

### Runtime bugs (visible sur les screenshots)
| # | Bug | Cause | Fix |
|---|-----|-------|-----|
| 6 | **"Could not load quiz"** | `generateQuiz` faisait un GET, mais le backend attend un **POST** avec `{topic, difficulty}` | → `api.js`: méthode POST + body JSON |
| 7 | **Quiz: mauvaise réponse toujours "wrong"** | `correctAnswer` du backend est un **index (0-3)** mais le code comparait avec la **string** de l'option | → `quiz.jsx`: comparaison par index |
| 8 | **Google OAuth: 403 disallowed_useragent** | React Native WebView est bloqué par Google | → `login.jsx`: ouverture dans le **navigateur système** + deep-link callback |

---

## Google OAuth — Comment ça marche maintenant

1. L'utilisateur tape "Continue with Google"
2. L'app ouvre le navigateur système (Chrome/Firefox) → Google accepte ✅
3. Après connexion, NextAuth redirige vers `aifakenewsdetector://auth/callback`
4. L'app intercepte ce deep-link et vérifie la session

> **Note backend** : Si le Google OAuth ne fonctionne toujours pas, vérifiez que dans la Google Console → Authorized redirect URIs vous avez bien `https://ai-fake-news-detector01.vercel.app/api/auth/callback/google`.

---

## Getting Started

```bash
npm install
npx expo start
```

Scan le QR code avec **Expo Go (SDK 53)** sur ton téléphone.

## Build APK

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```
