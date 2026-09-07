# Visual Guide AI Android-first delivery

## Overview

Visual Guide AI is now an Android-first Expo app for blind and low-vision users. The new experience is organized around **Safe-Step Confidence**: the app communicates possible visual and movement cues in short spoken messages, states uncertainty, and asks the user to pause and verify before moving.

The design was informed by the official positioning of Be My Eyes, which combines live volunteer/company help with AI visual assistance [1], and Google Lookout, which offers multiple visual-assistance modes including text, documents, explore, find, food labels, currency, and image questions [2]. Visual Guide AI differentiates itself by placing a movement-safety and trusted-guardian layer at the center rather than trying to reproduce every recognition mode.

## Implemented features

| Area | Implementation |
|---|---|
| First launch | Four-step accessible setup with safety boundary, helper language selection, optional helper name, spoken-guidance toggle, and permission explanations. |
| Android permissions | Foreground location, camera, notifications, and motion/orientation awareness. Each request has an explanation plus an explicit Not now path. |
| Safe-Step | Start/pause control, active state, confidence language, motion-steady indicator, concise pause-and-recheck wording, haptic feedback, and speech output. |
| Live location | Foreground live location watch with accuracy and current coordinates. The home screen displays a live-position card and can open Android Maps. |
| Guardian share | Temporary share session capped at one hour, stop control, automatic expiry, share text, tokenized guardian route, and a guardian view route that polls the latest position. |
| Camera guide | On-demand Android camera preview and capture. The user can ask about a scene, product, sign, doorway, or label. The captured image is sent to the server-side multimodal model and the answer is spoken in the selected language. |
| Languages | English, Spanish, Hindi, and Urdu voice settings. Language can be selected during helper setup and changed later in Settings. |
| Nearby discovery | One-tap shortcuts for Nature/tree, Beach, Bench, and Market/shopping mall searches through Android Maps. |
| Settings | Language, spoken guidance, haptic reinforcement, concise Safe-Step, and permission-status controls with TalkBack-friendly labels. |
| Branding | The supplied Visual Guide AI logo is included in the app UI, with a cropped square mark for the onboarding header and a larger supplied logo asset for the home screen. |

## Validation

The project passed `pnpm check`, `pnpm lint`, and the existing Vitest suite. The Expo web preview was used for smoke testing because the sandbox does not provide an Android device. The preview successfully validated onboarding progression, permission sequencing, Safe-Step activation, Settings navigation, accessible labels, and the main home-screen information architecture.

The implementation intentionally skips native camera/location behavior in the web preview. Real Android permission prompts, GPS fixes, camera capture, motion sensors, speech output, and Android Maps intents require an Android build or device.

## Important production limitations

The guardian-share backend currently uses an in-memory prototype session store. It supports the full one-hour session lifecycle during the server process lifetime, but production deployment should move sessions and location updates into the project database or a durable low-latency store. The guardian URL also assumes that the published app has a public web origin at `https://visualguide.ai`; update that origin in the share-link construction before production release.

The camera experience is **on-demand capture-and-answer**, not continuous real-time object detection. This is deliberate for the first Android version because continuous vision has higher battery, latency, privacy, and safety costs. It should remain an awareness aid and must not be presented as a replacement for a cane, guide dog, trained mobility support, or emergency service.

## Primary files

- `app/(tabs)/index.tsx` — Safe-Step home, live position, guardian share, nearby shortcuts, camera questions, speech, and motion status.
- `components/onboarding-gate.tsx` — first-run helper setup and permission flow.
- `app/(tabs)/settings.tsx` — language, speech, haptics, concise guidance, and permission status.
- `app/share/[sessionId].tsx` — temporary guardian view.
- `server/routers.ts` — share session procedures and server-side multimodal image description.
- `lib/app-state.ts`, `lib/permissions.ts`, `lib/speech.ts` — shared settings, permissions, and multilingual speech helpers.
- `assets/images/visual-guide-logo.webp` and `assets/images/visual-guide-mark.png` — supplied logo assets.

## References

[1]: https://www.bemyeyes.com/ "Be My Eyes — Accessibility Technology for blind & low vision people"

[2]: https://play.google.com/store/apps/details?id=com.google.android.apps.accessibility.reveal&hl=en_US "Lookout - Assisted vision — Google Play"
