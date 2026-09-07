# VisionGuide AI Mobile Interface Design

## Product framing

VisionGuide AI is an Android-first, portrait-oriented assistant that helps a person become aware of important obstacles around them. V1 does not promise navigation, route guidance, complete scene understanding, or guaranteed safety. The interface should repeatedly reinforce that the user remains responsible for decisions and should use a cane, guide dog, or human assistance where appropriate.

The design follows mainstream iOS and Android mobile conventions while prioritizing one-handed operation, high contrast, large touch targets, spoken feedback, haptics, and minimal visual complexity.

## Screen list

| Screen | Primary content and functionality |
|---|---|
| Awareness | Main experience. Large live-awareness status, a prominent Start awareness button, the latest detected obstacle cue, confidence/state indicator, audio and haptic status, and a compact safety reminder. |
| Detection details | A readable history of recent cues such as “person ahead” or “object nearby,” with time, relative direction, and urgency. No route instructions are shown. |
| Settings | Toggles for spoken alerts, haptic alerts, alert frequency, and preferred alert verbosity. Settings are stored locally on the device. |
| Safety & limits | Plain-language explanation of what V1 can and cannot do, including the distinction between obstacle awareness and navigation. Includes a short “before you walk” checklist. |
| First-run orientation | A brief onboarding flow explaining permissions, the awareness promise, alert controls, and the need to keep an independent mobility aid or support. |

## Awareness screen layout

The top safe-area region contains the VisionGuide mark, the current mode label (“Awareness mode”), and a secondary settings affordance. The middle of the screen is a high-contrast status panel with a large state such as “Ready to check surroundings” or “Awareness active.” The primary action is a full-width pill button in the lower half of the screen so it can be reached comfortably with one hand.

When awareness is active, the status panel changes to an alert-oriented layout. The latest cue is displayed in large text, with a short directional qualifier such as “ahead” or “to your right” only when the detection layer provides that information. The app should use “possible” or “detected” language rather than certainty when confidence is limited. A secondary stop button remains visible and accessible.

A bottom information card contains the V1 promise: “Helps you notice important obstacles. It does not guide you safely through every environment.” The card links to Safety & limits.

## Key user flows

### First launch

1. The user sees a short explanation of obstacle awareness and the explicit non-navigation boundary.
2. The user enables or skips spoken and haptic alert preferences.
3. The user reaches Awareness with the app in a ready state.

### Start awareness

1. The user taps Start awareness.
2. The app gives a brief haptic confirmation and announces that awareness is active when audio is enabled.
3. The local detection layer produces a cue when an important obstacle is detected.
4. The app presents the latest cue visually and, if enabled, speaks a concise alert.
5. The user taps Stop awareness to end the session.

### Review a cue

1. The user taps the latest cue or Detection details.
2. The app shows recent cues in a large, readable list.
3. The user can return to Awareness without changing the active state.

### Adjust alerts

1. The user opens Settings.
2. The user toggles spoken alerts, haptics, alert frequency, or verbosity.
3. The app saves the change locally and confirms it with a subtle haptic response when available.

### Learn the limits

1. The user opens Safety & limits.
2. The app explains that the detector can miss, misclassify, or misunderstand objects and conditions.
3. The user reads the independent-mobility reminder and returns to Awareness.

## Interaction and accessibility rules

Primary actions use large touch targets, visible press feedback, and concise labels. Text uses strong contrast and avoids color-only meaning. Every important alert has a text representation, while audio and haptics are optional channels that can be controlled independently. The app avoids rapid flashing, complex gestures, and dense dashboards.

## Brand colors

| Token | Color | Purpose |
|---|---|---|
| Deep night | `#08111F` | Primary background and high-contrast surfaces |
| Signal blue | `#37B6FF` | Main action and active awareness accent |
| Safety amber | `#FFC857` | Caution and attention states |
| Clear mint | `#65E6B0` | Ready/healthy state |
| Alert coral | `#FF6B6B` | High-priority warning state |
| Cloud | `#F5F8FC` | Primary light text |
| Slate | `#AAB8C8` | Secondary text and supporting labels |

The visual language is calm and technical rather than medical or emergency-themed. Signal blue identifies available actions, amber indicates attention, and coral is reserved for higher-priority awareness cues.

## V1 implementation boundary

The prototype will implement the product experience with a local detection simulation layer so the interface and alert behavior can be evaluated without pretending that a production detector is already integrated. The detector seam will be structured so a future Android CameraX and bundled on-device model integration can replace the simulation without changing the core user flows.
