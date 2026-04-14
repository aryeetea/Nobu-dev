# Nobu Live2D iOS Renderer

This folder is reserved for the native iOS Live2D renderer.

Current status:

- The app links the official Live2D Cubism Core static library from `vendor/live2d/ios/Core`.
- The app bundles the original `public/models` folder as an iOS resource folder.
- `NobuLive2DBridge` exposes Cubism Core readiness and bundled model checks to Swift.
- `NobuRootViewController` calls the bridge at launch and logs Core/model readiness.

Target architecture:

- Load the official Live2D Cubism SDK for Native.
- Load Alexia and Asuka from bundled app resources.
- Render the model in a native view above or beside the app UI.
- Expose a bridge API for character, expression, motion, speaking, listening, and room actions.

The renderer should preserve the creator's Live2D files and avoid re-rigging or altering the art.
