# AGENTS.md — Guide for the AI Agent Building This Project

Welcome. This file is your starting point. Read it fully before you write a single line of code.

---

## What You Are Building

You are building a mobile app called **Pocket AI**.

It is an Expo (React Native) application that lets users browse AI models from Hugging Face, install them directly onto their phone, and chat with them — fully offline, fully on-device. The AI that runs on the user's phone also automatically knows about the device it's running on: the phone model, installed apps, available storage, RAM, and more.

For the full idea, context, and feature breakdown — **read `IDEA.md` before doing anything else.** That file is the source of truth for what this app is supposed to do and why.

---

## Tech Stack

- **Framework:** Expo (managed workflow to start, bare if we need native modules)
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based routing)
- **Styling:** NativeWind (Tailwind CSS for React Native) or StyleSheet — keep it consistent, pick one and stick to it
- **State management:** Zustand (lightweight, simple)
- **Data fetching:** TanStack Query (React Query) for the Hugging Face API calls
- **Local storage:** expo-secure-store for settings, expo-file-system for model files
- **Device info:** expo-device, expo-file-system, react-native-device-info

---

## Project Structure

Follow this folder structure:

```
/app                   → All screens (Expo Router file-based)
  /(tabs)              → Bottom tab screens
    index.tsx          → Home / Discover
    my-models.tsx      → Installed models
    settings.tsx       → Settings
  /model/[id].tsx      → Model detail screen
  /chat/[modelId].tsx  → Chat screen

/components            → Reusable UI components
/hooks                 → Custom hooks (useDeviceInfo, useModels, etc.)
/store                 → Zustand stores
/services              → API calls, model management logic, device context
/constants             → Colors, config, API endpoints
/types                 → TypeScript types and interfaces
/assets                → Images, fonts, icons
```

---

## Key Rules — Follow These Always

1. **Read IDEA.md first.** Every feature decision should trace back to what's described there. If something isn't in IDEA.md, ask before building it.

2. **TypeScript everywhere.** No plain `.js` files. Type everything properly — no `any` unless absolutely unavoidable and commented with a reason.

3. **One thing at a time.** Build and verify one feature before moving to the next. Do not scaffold the whole app at once and leave things half-working.

4. **Don't over-engineer.** This is an MVP. Simple, working code beats clever, complex code. If there are two ways to do something, pick the simpler one.

5. **Expo managed first.** Stay in Expo managed workflow unless a specific native module forces you out. Document clearly if and why you had to eject or go bare.

6. **Never hardcode secrets.** Any API keys (even public ones like Hugging Face) go in environment variables via `.env` and `expo-constants`. Never commit a `.env` file.

7. **Handle loading and error states.** Every screen that fetches data must have a loading state and a proper error state. No silent failures.

8. **Test on both platforms.** The app must work on both Android and iOS. Do not write platform-specific code without a clear reason, and always handle both sides if you do.

9. **Ask before adding dependencies.** Every new package adds weight and potential breaking changes. If you think you need a new library, explain why before installing it.

10. **Leave comments for non-obvious logic.** Especially in the model runner, device info collection, and any native bridge code.

---

## The Hugging Face API

Models are fetched from the Hugging Face public API. No auth token is needed for basic listing.

Base endpoint for listing models:
```
https://huggingface.co/api/models
```

Useful query parameters:
- `search` — keyword search
- `filter` — filter by tag (e.g. `gguf` for mobile-runnable models)
- `sort` — sort by downloads, likes, created date
- `limit` — number of results per page
- `direction` — `-1` for descending

For the MVP, focus on **GGUF format models** — these are the quantized, compressed versions that can actually run on a mobile device. Always filter for `gguf` by default.

---

## Device Context — How It Works

When a user opens a chat with an installed model, the app gathers device information automatically and prepends it to the AI's system prompt. The AI then "knows" this context without the user typing anything.

Information to collect and pass:

- Phone manufacturer and model (e.g. Samsung Galaxy S23)
- OS and version (e.g. Android 14)
- Total RAM and available RAM
- Total storage and free storage
- List of installed apps (requires permission — Android only via react-native-device-info, iOS is restricted)
- Device timezone and locale/language
- Battery level

This data is assembled into a system prompt block that is invisibly sent at the start of every chat session. The user never sees it, but the AI uses it to give contextually relevant answers.

---

## Phases of Development

### Phase 1 — Foundation
- Expo project setup with TypeScript, Expo Router, NativeWind
- Tab navigation structure
- Basic Hugging Face API integration
- Model list screen with search and filters

### Phase 2 — Model Management
- Model detail screen
- Download flow (progress, pause, cancel)
- Local storage of downloaded models
- "My Models" screen

### Phase 3 — On-Device Chat
- Integrate a local model runner (llama.cpp via react-native-llama or similar)
- Basic chat UI
- Pass device context as system prompt automatically

### Phase 4 — Polish
- Compatibility detection (warn if model is too big/slow for the device)
- Settings screen
- Error handling and edge cases
- Performance tuning

---

## What to Do Right Now

1. Read `IDEA.md` completely
2. Set up the Expo project with the stack described above
3. Confirm the folder structure is in place
4. Start with Phase 1 — get the model list screen working with real data from Hugging Face before touching anything else

---

*This file should be updated as the project evolves. If a major architectural decision changes, document it here.*