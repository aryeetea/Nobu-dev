# Nobu Mobile App

Nobu is now mobile-first. The website is not the product; the iPhone and Android apps are.

## Direction

The app should not depend on Netlify by default. Capacitor now loads the bundled app shell unless `CAPACITOR_SERVER_URL` is explicitly provided for temporary testing.

For the character renderer, the target is the official Live2D Cubism SDK so Alexia and Asuka stay in their original Live2D format. Do not convert, redraw, flatten, or re-rig creator art into another system unless the creator explicitly approves it.

## Native Live2D Plan

1. Download the official Live2D Cubism SDKs from Live2D:
   - Cubism SDK for Native, iOS
   - Cubism SDK for Native, Android

2. Place the SDKs outside git first, then copy only the allowed redistributable/framework files into the native projects after confirming the SDK license.

3. Keep the creator model files unchanged:
   - `public/models/Alexia`
   - `public/models/ASUKA`

4. Add native Live2D views:
   - iOS: Swift/Metal/OpenGL view controlled from the app.
   - Android: Kotlin/Java renderer view controlled from the app.

5. Bridge app commands into native Live2D:
   - `setCharacter("Alexia" | "Asuka")`
   - `setExpression(id)`
   - `playMotion(group, index)`
   - `setSpeaking(true | false)`
   - `setListening(true | false)`
   - `setRoomAction("bed" | "desk" | "chair" | "window" | "center")`

## Temporary Remote Testing

Only use this while debugging:

```bash
CAPACITOR_SERVER_URL=https://heynobu.netlify.app npm run mobile:sync
```

For the real app build, leave `CAPACITOR_SERVER_URL` unset:

```bash
npm run mobile:sync
```

## Local iOS

Open Xcode:

```bash
npm run mobile:ios
```

## Local Android

Open Android Studio:

```bash
npm run mobile:android
```

## Voice Permissions

The native projects include microphone permissions:

- iOS: `NSMicrophoneUsageDescription`
- Android: `RECORD_AUDIO`

## Live2D Model Credits

Nobu uses third-party Live2D character models. Do not submit the app to the App Store or Play Store until each model has confirmed commercial/app usage rights and an accurate creator credit.

Current credit placeholders:

- Alexia: creator/source/license still need to be confirmed.
- Asuka: creator/source/license still need to be confirmed.

Recommended app listing credit wording once the creator names are known:

```text
Live2D character model credits: Alexia by [Creator Name], Asuka by [Creator Name]. Used with permission.
```

Do not show these credits inside the main app experience unless the model license requires it.

## Current Model Inventory

Alexia includes:

- 16 expression files: bbt, dyj, h, k, lh, lzx, mj, sq, wh, xxy, y, yf, yfmz, yjys1, yjys2, zs1.
- 1 motion file: dh.motion3.json.
- Toggle-style parameters for sunglasses, glasses, outfit, outfit with hat, question mark, sweat, grin, star eyes, dizzy, angry, blush, cry, pose, and eye colors.

Asuka includes:

- 4 expression files: Gloom, Happy Sparkle, Star Eyes Toggle, coat toggle.
- 3 motion files: Hand wave, cry, model preview.

## App Store Note

Google sign-in and other OAuth providers may need native OAuth instead of web OAuth. If login becomes a blocker, use native OAuth and pass the authenticated session into the app.
