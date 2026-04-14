# Nobu Mobile App

Nobu is now mobile-first. The website is not the product; the iPhone and Android apps are.

## Direction

The app should not depend on Netlify by default. Capacitor now loads the bundled app shell unless `CAPACITOR_SERVER_URL` is explicitly provided for temporary testing.

For the character renderer, the target is the official Live2D Cubism SDK so Alexia and Asuka stay in their original Live2D format. Do not convert, redraw, flatten, or re-rig creator art into another system unless the creator explicitly approves it.

## Creator Originals First

Nobu should load the creator's original model definitions first:

- Alexia: `public/models/Alexia/Alexia.model3.json`
- Asuka: `public/models/ASUKA/Asuka.model3.json`

The `*.app.model3.json` files and `2048` texture folders are performance fallbacks only. Use them only if the official native SDK build needs a lighter mobile profile after testing on real devices.

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

## Camera Vision Plan

Camera vision belongs in the native app flow, not as a website-only shortcut.

1. Ask for camera permission only when the user chooses a visual action.
2. Let the user capture or pick an image of an outfit, room, note, or object.
3. Send a resized image to a secure server route for AI analysis.
4. Return a short, voice-friendly answer to Nobu.
5. Map the answer tone to Live2D expression and motion commands so the character matches the voice.

Do not put private AI provider keys in `NEXT_PUBLIC_` environment variables. Camera analysis should go through a server-side route or native secure backend.

Current repo-side status:

- Native camera permissions are present for iOS and Android.
- `/api/vision` accepts a camera image payload and validates it.
- AI vision analysis is intentionally not connected until a server-side provider key is added safely.

Expected request shape for `/api/vision`:

- method: `POST`
- content type: `multipart/form-data`
- fields: `image`, `kind`, optional `prompt`
- allowed `kind` values: `outfit`, `room`, `note`, `object`

## Environment Rules

Use `.env.example` as the template. Keep public and private values separate:

- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` is okay because the app needs the agent ID.
- `ELEVENLABS_API_KEY` must stay server-side.
- Do not use `NEXT_PUBLIC_` for API keys, tokens, database URLs, auth secrets, or provider secrets.

## Temporary Remote Testing

Only use this while debugging:

```bash
CAPACITOR_SERVER_URL=https://heynobu.netlify.app npm run mobile:sync
```

For the real app build, leave `CAPACITOR_SERVER_URL` unset:

```bash
npm run mobile:sync
```

## Prepare Live2D SDK Locally

After downloading the official Native SDK zip, prepare the local ignored SDK folders:

```bash
npm run mobile:prepare-live2d -- /Users/naaayele/Downloads/CubismSdkForNative-5-r.5.zip
```

This creates:

- `vendor/live2d/ios`
- `vendor/live2d/android`
- `vendor/live2d/sdk-source`

These folders are ignored by git so the licensed SDK files stay on your machine.

## Local iOS

Open Xcode:

```bash
npm run mobile:preflight
npm run mobile:ios
```

## Local Android

Open Android Studio:

```bash
npm run mobile:preflight
npm run mobile:android
```

## Mobile Preflight

Before opening Xcode or Android Studio, run:

```bash
npm run mobile:preflight
```

This checks that the original Live2D model files exist, camera and microphone permissions are present, Capacitor is not locked to Netlify, and the official SDK folders are ready or clearly marked as missing.

## Voice And Camera Permissions

The native projects include microphone and camera permissions:

- iOS: `NSMicrophoneUsageDescription`
- iOS: `NSCameraUsageDescription`
- Android: `RECORD_AUDIO`
- Android: `CAMERA`

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
