# Runtime smoke test findings

The Expo web preview bundled successfully and rendered the new first-run onboarding screen. The screen visibly shows the Visual Guide AI brand row, setup progress `1/4`, the Safe-Step introduction, the safety boundary, and a working `Begin setup` button. The browser console/log showed only expected Expo web notifications support warnings and an existing theme debug log; no bundle or route error occurred.

The app preview is available at the temporary development URL used during this task. The final mobile artifact remains Android-first; web preview is only used for smoke testing.

## Helper setup interaction

The preview advanced from step 1 to step 2 through the `Begin setup` control. The helper setup rendered four language radio options (English, Español, हिन्दी, اردو), an optional helper-name input, a spoken-guidance switch, and a visible Continue button after a short scroll. Controls were exposed with accessible roles and labels.

## Permission flow interaction

The permission sequence rendered as step 1 Location followed by step 2 Camera. On web preview, both correctly show `Not available in this preview` rather than pretending access was granted, and each exposes separate `Allow access` and `Not now` controls. Selecting Not now advanced from Location to Camera as designed.

The flow continued through Safety notifications and ended with Motion awareness. Motion is shown as allowed because Android does not require a separate runtime permission prompt for the sensor access used here. The final action is `Next step`, so the sequence remains complete even when the optional permission prompts are skipped.

## Home screen runtime validation

After onboarding completion, the first web preview exposed a native `DeviceMotion.addListener` error. The code was corrected to skip native motion registration on web while retaining it on Android. A second preview then exposed an Expo Keep Awake web Wake Lock rejection; this was corrected by moving `useKeepAwake` into a native-only child component. The refreshed preview now renders the Safe-Step home screen with the brand header, Safe-Step control, live position, guardian sharing, nearby place shortcuts, camera guide, language/motion status, safety boundary, and accessible tab navigation.

## Safe-Step and Settings smoke test

The main action changes from `Start Safe-Step` to `Pause Safe-Step` and updates the hero card to `SAFE-STEP ACTIVE`, `NOTICE`, and a concise pause-and-recheck message. The Settings tab renders four spoken languages, helper-friendly explanations, spoken/haptic/concise toggles, and Android permission status rows. The home and settings routes remained accessible through the tab bar.
