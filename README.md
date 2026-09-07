# Visual Guide AI

**Visual Guide AI** is an Android-first assistive awareness app for blind and low-vision users. It turns selected camera and motion cues into concise speech, shows live position, supports a one-hour trusted-guardian share, and provides nearby place shortcuts.

> Visual Guide AI is an awareness aid. It can miss or misunderstand objects, distance, direction, and location context. It does not replace a cane, guide dog, trained mobility support, or emergency services.

## Included in this release

- Four-step first-run setup for a sighted helper.
- Android permission explanations for Location, Camera, Notifications, and Motion awareness.
- Safe-Step Confidence mode with start/pause, pause-and-recheck language, haptics, and speech.
- English, Spanish, Hindi, and Urdu speech settings.
- Live foreground location with current coordinates and Android Maps shortcut.
- Temporary guardian sharing capped at one hour with a stop control and guardian-view route.
- On-demand camera capture for scene, product, label, sign, and doorway questions.
- Server-side multimodal AI endpoint so model credentials are not exposed in the Android app.
- Nearby shortcuts for Nature/tree, Beach, Bench, and Market/shopping mall.
- Accessible Settings and in-app privacy-policy screen.
- Supplied Visual Guide AI logo assets.

## Run locally

Install Node.js and pnpm, then run:

```bash
pnpm install
pnpm check
pnpm lint
pnpm dev
```

For a native Android development build, install Android Studio and an Android SDK, then use:

```bash
pnpm android
```

The server-side camera description endpoint requires the project’s configured server environment. Do not put model credentials in the mobile client.

## Build Android artifacts

The repository includes `eas.json` profiles:

```bash
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform android --profile production
```

The `preview` profile creates an installable APK. The `production` profile creates an Android App Bundle for Google Play. EAS authentication and Android signing ownership are intentionally left to the app owner.

## Before publishing

Replace the placeholders in `app/privacy.tsx` with the legal developer name, privacy contact, actual storage/retention behavior, deletion process, and public HTTPS privacy-policy URL. Set `PUBLIC_SHARE_BASE_URL` to the real deployed guardian-share domain rather than the default placeholder. Review the Google Play Data Safety form against the final backend and SDK behavior.

The current guardian-share server uses an in-memory session store for the prototype. A production deployment should use durable storage, authentication or a stronger share-token design, expiry cleanup, rate limiting, abuse monitoring, and encrypted transport.

## Public project

Source repository: https://github.com/Khattakyr11111/visual-guide-ai

## License

Choose and add a license before accepting outside contributions or distributing the source commercially.
