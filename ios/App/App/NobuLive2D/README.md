# Nobu Live2D iOS Renderer

This folder is reserved for the native iOS Live2D renderer.

Current status:

- The app links the official Live2D Cubism Core static library from `vendor/live2d/ios/Core`.
- The app compiles the official Live2D Framework common sources and Metal renderer from `vendor/live2d/ios/Framework/src`.
- The Xcode target has a build phase that creates `FrameworkMetallibs/MetalShaders.metallib` from the official Live2D Metal shader source.
- The app bundles the original `public/models` folder as an iOS resource folder.
- `NobuLive2DBridge` exposes Cubism Core readiness and bundled model checks to Swift.
- `NobuRootViewController` calls the bridge at launch and logs Core/model readiness.
- `NobuLive2DView` creates a transparent native Metal layer over the selected room image and loads Alexia from the bundled original model folder.

Target architecture:

- Device-test the Metal layer with Alexia and adjust placement/scale against the selected room image.
- Add Asuka selection into the native command surface.
- Expose a bridge API for expression, motion, outfit toggle, speaking, listening, and room actions.
- Repeat the renderer integration on Android.

The renderer should preserve the creator's Live2D files and avoid re-rigging or altering the art.
