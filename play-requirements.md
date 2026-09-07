# Google Play release requirements gathered for Visual Guide AI

Google Play’s official setup guidance says the developer creates the app in Play Console, chooses the default language and app name, declares free or paid status, provides a contact email, accepts policy/export declarations and Play App Signing terms, then completes store listing, content, testing, release, and launch tasks. Google Play uses Android App Bundles for optimized delivery, and package names are unique and permanent.

Source: https://support.google.com/googleplay/android-developer/answer/9859152?hl=en

Google Play’s official User Data guidance says all apps must provide a privacy-policy link in Play Console and a link or text in the app. The policy must disclose developer/contact information, accessed/collected/used/shared personal and sensitive data, security practices, retention and deletion. Data Safety declarations must match the actual behavior and SDKs, and prominent in-app disclosures with affirmative consent are required before requesting sensitive permissions when applicable.

Source: https://support.google.com/googleplay/android-developer/answer/10144311?hl=en

For this app, the Play Console declarations must be reviewed carefully because the app requests location, camera, notifications, and motion access; sends user-requested camera images to the server-side multimodal AI service; and temporarily shares location through guardian sessions. The production privacy policy and Data Safety form must describe the final deployed backend and retention behavior, not merely the current prototype state.
