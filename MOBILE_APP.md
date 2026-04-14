# Nobu Mobile Apps

Nobu now has Capacitor native shells for iPhone and Android.

## How It Works

The native apps load your hosted Next.js Nobu app in a native WebView. This is the right setup for the current codebase because Nobu depends on Next API routes, NextAuth, Prisma, and ElevenLabs WebRTC.

Nobu remains the main app. ScanFit is a fashion capability inside Nobu for outfit feedback, smart sizing, look history, and shopping help.

The bundled `capacitor-web/index.html` file is only a fallback screen. The real app URL comes from `CAPACITOR_SERVER_URL`.

## Production Setup

1. Deploy the Next.js app to an HTTPS URL.

2. Sync that URL into the native projects:

```bash
CAPACITOR_SERVER_URL=https://your-nobu-domain.com npm run cap:sync
```

3. Open the iPhone project:

```bash
npm run cap:open:ios
```

4. Open the Android project:

```bash
npm run cap:open:android
```

5. Build and submit from Xcode and Android Studio.

## Local Testing

For local device testing, run Next on your network:

```bash
npm run dev -- -H 0.0.0.0
```

Then sync with your Mac's LAN URL:

```bash
CAPACITOR_SERVER_URL=http://YOUR_LAN_IP:3000 npm run cap:sync
```

Use a deployed HTTPS URL for serious testing and app store builds.

## Voice Permissions

The native projects already include microphone permissions:

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

## Live2D Capability Inventory

Alexia currently includes:

- 16 expression files: bbt, dyj, h, k, lh, lzx, mj, sq, wh, xxy, y, yf, yfmz, yjys1, yjys2, zs1.
- 1 motion file: dh.motion3.json.
- Toggle-style parameters for sunglasses, glasses, outfit, outfit with hat, question mark, sweat, grin, star eyes, dizzy, angry, blush, cry, pose, and eye colors.

Asuka currently includes:

- 4 expression files: Gloom, Happy Sparkle, Star Eyes Toggle, coat toggle.
- 3 motion files: Hand wave, cry, model preview.

The current renderer displays the models reliably. The next renderer upgrade should expose the creator-provided expressions, motions, and toggles through app state so Nobu can react visually while speaking.

## Important App Store Note

Google sign-in and other OAuth providers can be picky inside embedded WebViews. If login becomes the next blocker, the clean path is native OAuth through Capacitor, then passing the authenticated session to the hosted app.
