# Nobu Vision

This package is reserved for the native Android camera and vision bridge.

The camera flow should:

- Request camera permission only when needed.
- Capture or select a user-approved image.
- Resize the image before analysis.
- Send analysis through a secure backend route, not a public client key.
- Return a compact result that can drive Nobu's voice, expression, and motion.

