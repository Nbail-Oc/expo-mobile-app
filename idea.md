# Pocket AI — What the App Does & How It Works

---

## What is this app?

Pocket AI is a mobile app that lets you **browse, download, and run real AI models directly on your phone** — no internet needed after download, no monthly subscription, no server in the cloud. The AI lives on your device.

Think of it like an app store, but only for AI brains. You pick one, install it, and then it runs entirely on your phone. That AI also automatically knows things about your device — your phone model, what apps you have, and more — so it can give you smarter, more relevant answers without you having to tell it anything.

---

## The Two Big Parts

### Part 1 — The Model Store (MVP, what we build first)

This is the main screen of the app. It's a browsable list of AI models pulled live from Hugging Face, which is the world's largest open collection of AI models (think GitHub, but for AI).

**What you see for each model:**

- Name and a short plain-English description of what it's good at
- How big it is (how many GB it'll take up on your phone)
- How fast it roughly runs (instant, fast, slow, very slow)
- How smart/capable it is (basic, capable, powerful)
- How much RAM your phone needs to run it
- A tag like "good for chat", "good for coding", "good for writing", etc.

**Filters you can use:**

You don't have to scroll through thousands of models. You can filter by:

- **Size** — Small (fits easily), Medium, Large (needs a powerful phone)
- **Speed** — Fast (replies in seconds), Slow (takes a moment), Very slow (takes a while)
- **Intelligence** — Basic (simple tasks), Smart (most things), Powerful (complex reasoning)
- **What it's for** — Chat, Coding help, Writing, Summarising, etc.
- **"Will it run on my phone?"** — The app checks your phone's specs and can auto-hide models that won't work well for you

**Installing a model:**

You tap a model, see its detail page, and hit Install. The app downloads the model file to your phone's storage. You can see download progress, pause it, or cancel. Once it's done, it shows up in your "My Models" section and you can start chatting with it immediately.

---

### Part 2 — The AI That Knows Your Phone (The Main Vision)

This is what makes this app special compared to just downloading a random AI.

When you chat with any model you've installed, that AI already knows a bunch of things about you and your device — automatically, without you typing any of it. Here's what it knows:

**About your device:**
- What phone you have (e.g. Samsung Galaxy S23, iPhone 15 Pro)
- How much storage you have left
- How much RAM your phone has
- Your operating system version
- Your battery level (so it can warn you before a heavy task drains it)

**About your phone's content (with your permission):**
- What apps you have installed — so the AI can help you use them ("open Spotify and play something chill") or suggest better apps for a task
- Your approximate location/timezone — so it knows if you're asking about "tonight" whether that means morning or evening somewhere else
- What language your phone is set to

**What this means in practice:**

Instead of asking the AI "how do I turn on dark mode on my Samsung S23 running Android 14?" — you just ask "how do I turn on dark mode?" and it already knows your phone. It gives you the exact steps for your exact device.

Or: "what's a good app for tracking my runs?" — and it checks what you already have installed, so it doesn't recommend something you already use, or suggests something that works better with apps you already have.

---

## Screen by Screen — How the App is Laid Out

### 1. Home / Discover Screen
The first thing you see when you open the app. Shows featured models, newly added ones, and recommended models based on your phone's capability. Has a search bar at the top and filter chips below it.

### 2. Model Detail Screen
When you tap on any model, you get a full page with everything about it — description, size, speed, what it can do, user ratings, and the Install button. Also shows a "Compatibility" badge — green if your phone can run it well, yellow if it'll be slow, red if it's not recommended for your device.

### 3. My Models Screen
All the AI models you've installed. Tap any one to open a chat with it. You can also see storage used and delete models you don't need anymore.

### 4. Chat Screen
The place where you actually talk to your installed AI. Looks like a regular messaging app. The AI responds locally — meaning your messages never leave your phone. There's a small info bar at the top showing which model you're using and a rough indicator of how fast it's thinking.

### 5. Settings Screen
- Manage storage (see what each model is using)
- Toggle permissions (apps list, location, etc.)
- Set a default model
- Download behaviour (Wi-Fi only, auto-download updates, etc.)

---

## Things the App Does Automatically (You Don't Have to Set These Up)

- Detects your phone model on first launch and uses it to pre-filter the model list
- Warns you if a model is too big for your available storage before you start downloading
- Warns you if a model needs more RAM than your phone has
- Hides or flags models that won't run on your phone's chip
- Passes your device info to the AI every time you start a chat, so it always has context

---

## What the App Does NOT Do (to keep it simple)

- It does not send your conversations to any server — everything stays on your device
- It does not require an account or login for the basic features
- It does not run the AI in the cloud — if the model isn't downloaded, it won't work offline
- It does not access your photos, messages, or contacts (unless we add that later as an optional feature)

---

## Future Ideas (Not in MVP, but on the roadmap)

- **Voice mode** — talk to your local AI out loud, get voice responses
- **App control** — let the AI actually open and do things in your apps (not just know about them)
- **Shortcuts** — set up quick actions like "summarise my last 5 notifications" with one tap
- **Multiple models at once** — route different types of questions to different models automatically
- **Model updates** — get notified when a better version of a model you use is available

---

## Summary in One Paragraph

Pocket AI is a mobile app where you browse a live catalogue of AI models (from Hugging Face), filter them by size, speed, and capability, install the ones you want directly onto your phone, and then chat with them — completely offline, completely private. The AI automatically knows what phone you have, what apps are on it, and basic things about your environment, so you never have to explain your setup. It's like having a personal AI assistant that actually lives on your phone and knows your phone.

---

*Document version: MVP planning — v0.1*