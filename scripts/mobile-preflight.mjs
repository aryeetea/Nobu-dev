import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

const checks = [
  {
    label: 'Alexia original Live2D model',
    path: 'public/models/Alexia/Alexia.model3.json',
    required: true,
  },
  {
    label: 'Asuka original Live2D model',
    path: 'public/models/ASUKA/Asuka.model3.json',
    required: true,
  },
  {
    label: 'Alexia performance fallback',
    path: 'public/models/Alexia/Alexia.app.model3.json',
    required: false,
  },
  {
    label: 'Asuka performance fallback',
    path: 'public/models/ASUKA/Asuka.app.model3.json',
    required: false,
  },
  {
    label: 'iOS official Live2D SDK placeholder',
    path: 'vendor/live2d/ios',
    required: false,
  },
  {
    label: 'Android official Live2D SDK placeholder',
    path: 'vendor/live2d/android',
    required: false,
  },
  {
    label: 'iOS Live2D Core bridge header',
    path: 'ios/App/App/NobuLive2D/NobuLive2DBridge.h',
    required: true,
  },
  {
    label: 'iOS Live2D Core bridge implementation',
    path: 'ios/App/App/NobuLive2D/NobuLive2DBridge.mm',
    required: true,
  },
  {
    label: 'iOS native Live2D view header',
    path: 'ios/App/App/NobuLive2D/NobuLive2DView.h',
    required: true,
  },
  {
    label: 'iOS native Live2D view implementation',
    path: 'ios/App/App/NobuLive2D/NobuLive2DView.mm',
    required: true,
  },
  {
    label: 'iOS Swift bridge header',
    path: 'ios/App/App/App-Bridging-Header.h',
    required: true,
  },
]

let failed = false

function mark(ok, label, detail = '') {
  const icon = ok ? 'PASS' : 'FAIL'
  console.log(`${icon} ${label}${detail ? `: ${detail}` : ''}`)
}

function todo(label, detail = '') {
  console.log(`TODO ${label}${detail ? `: ${detail}` : ''}`)
}

for (const check of checks) {
  const found = existsSync(join(root, check.path))

  if (!found && check.required) {
    failed = true
  }

  if (!found && !check.required) {
    todo(check.label, `missing ${check.path}`)
  } else {
    mark(found, check.label, found ? check.path : `missing ${check.path}`)
  }
}

const capacitorConfig = readFileSync(join(root, 'capacitor.config.ts'), 'utf8')
const iosInfo = readFileSync(join(root, 'ios/App/App/Info.plist'), 'utf8')
const androidManifest = readFileSync(join(root, 'android/app/src/main/AndroidManifest.xml'), 'utf8')
const live2dModels = readFileSync(join(root, 'app/lib/live2d-models.ts'), 'utf8')
const xcodeProject = readFileSync(join(root, 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8')
const nativeLive2DView = readFileSync(join(root, 'ios/App/App/NobuLive2D/NobuLive2DView.mm'), 'utf8')
const prepareLive2DSdk = readFileSync(join(root, 'scripts/prepare-live2d-sdk.mjs'), 'utf8')
const envLocalPath = join(root, '.env.local')
const envLocal = existsSync(envLocalPath) ? readFileSync(envLocalPath, 'utf8') : ''

const configUsesOptionalServer = capacitorConfig.includes('CAPACITOR_SERVER_URL')
mark(configUsesOptionalServer, 'Capacitor uses bundled app by default')
failed ||= !configUsesOptionalServer

const iosCamera = iosInfo.includes('NSCameraUsageDescription')
const iosMic = iosInfo.includes('NSMicrophoneUsageDescription')
mark(iosCamera, 'iOS camera permission')
mark(iosMic, 'iOS microphone permission')
failed ||= !iosCamera || !iosMic

const androidCamera = androidManifest.includes('android.permission.CAMERA')
const androidMic = androidManifest.includes('android.permission.RECORD_AUDIO')
mark(androidCamera, 'Android camera permission')
mark(androidMic, 'Android microphone permission')
failed ||= !androidCamera || !androidMic

const keepsAlexiaOriginal = live2dModels.includes("path: '/models/Alexia/Alexia.model3.json'")
const keepsAsukaOriginal = live2dModels.includes("path: '/models/ASUKA/Asuka.model3.json'")
const nativeUsesAlexiaAppModel = nativeLive2DView.includes('Alexia.app.model3.json')
const nativeUsesAsukaAppModel = nativeLive2DView.includes('Asuka.app.model3.json')
mark(keepsAlexiaOriginal, 'Alexia creator original remains available')
mark(keepsAsukaOriginal, 'Asuka creator original remains available')
mark(nativeUsesAlexiaAppModel, 'Native app uses Alexia mobile texture model')
mark(nativeUsesAsukaAppModel, 'Native app uses Asuka mobile texture model')
failed ||= !keepsAlexiaOriginal || !keepsAsukaOriginal ||
  !nativeUsesAlexiaAppModel || !nativeUsesAsukaAppModel

const iosBundlesModels = xcodeProject.includes('models in Resources') &&
  xcodeProject.includes('../../../public/models')
const iosLinksLive2DCore = xcodeProject.includes('-lLive2DCubismCore') &&
  xcodeProject.includes('vendor/live2d/ios/Core/include')
const iosUsesBridgeHeader = xcodeProject.includes('SWIFT_OBJC_BRIDGING_HEADER = "App/App-Bridging-Header.h"')
const iosCompilesNativeLive2DView = xcodeProject.includes('NobuLive2DView.mm in Sources') &&
  xcodeProject.includes('MetalKit.framework in Frameworks')
const iosCompilesOfficialLive2DMetal = xcodeProject.includes('CubismFramework.cpp in Sources') &&
  xcodeProject.includes('CubismRenderer_Metal.mm in Sources') &&
  xcodeProject.includes('vendor/live2d/ios/Framework/src')
const iosBuildsLive2DMetalShaders = xcodeProject.includes('Compile Live2D Metal shaders') &&
  xcodeProject.includes('FrameworkMetallibs') &&
  xcodeProject.includes('MetalShaders.metal') &&
  xcodeProject.includes('FragShaderSrcBlend') &&
  xcodeProject.includes('CSM_COLOR_BLEND_MODE') &&
  xcodeProject.includes('VertShaderSrcMaskedBlend')
const iosLive2DDepthTexture = nativeLive2DView.includes('MTLPixelFormatDepth32Float') &&
  nativeLive2DView.includes('passDescriptor.depthAttachment.texture')
const iosLive2DZeroBufferGuard = prepareLive2DSdk.includes('patchMetalCommandBuffer') &&
  prepareLive2DSdk.includes('bufferLength == 0')
const iosLive2DUrlShaderLoader = prepareLive2DSdk.includes('patchMetalShaderLoader') &&
  prepareLive2DSdk.includes('newLibraryWithURL:vertShaderFileLibURL') &&
  prepareLive2DSdk.includes('newLibraryWithURL:fragShaderFileLibURL')
const iosLive2DReleasesShaderLibraries = prepareLive2DSdk.includes('[vertShaderLib release]') &&
  prepareLive2DSdk.includes('[fragShaderLib release]')
const iosLive2DDataTextureLoader = nativeLive2DView.includes('newTextureWithData') &&
  nativeLive2DView.includes('MobileTextureFallbackPath') &&
  nativeLive2DView.includes('_loadedTextures') &&
  nativeLive2DView.includes('@"public" stringByAppendingPathComponent')
const iosLive2DBlendFallback = prepareLive2DSdk.includes('patchMetalBlendShaderFallback') &&
  prepareLive2DSdk.includes('ShaderNames_NormalMaskedInvertedPremultipliedAlpha') &&
  prepareLive2DSdk.includes('fallbackShaderSet->RenderPipelineState')
mark(iosBundlesModels, 'iOS bundles original Live2D model folder')
mark(iosLinksLive2DCore, 'iOS links official Live2D Cubism Core')
mark(iosUsesBridgeHeader, 'iOS exposes Live2D bridge to Swift')
mark(iosCompilesNativeLive2DView, 'iOS compiles native Live2D Metal view')
mark(iosCompilesOfficialLive2DMetal, 'iOS compiles official Live2D Framework Metal renderer')
mark(iosBuildsLive2DMetalShaders, 'iOS builds Live2D Metal shader library')
mark(iosLive2DDepthTexture, 'iOS provides Live2D Metal depth texture')
mark(iosLive2DZeroBufferGuard, 'iOS patches Live2D zero-length Metal buffers')
mark(iosLive2DUrlShaderLoader, 'iOS loads Live2D shader libraries by URL')
mark(iosLive2DReleasesShaderLibraries, 'iOS releases temporary Live2D shader libraries')
mark(iosLive2DDataTextureLoader, 'iOS loads and retains Live2D textures from bundled data')
mark(iosLive2DBlendFallback, 'iOS avoids opening every Live2D blend shader at startup')
failed ||= !iosBundlesModels || !iosLinksLive2DCore || !iosUsesBridgeHeader ||
  !iosCompilesNativeLive2DView || !iosCompilesOfficialLive2DMetal ||
  !iosBuildsLive2DMetalShaders || !iosLive2DDepthTexture || !iosLive2DZeroBufferGuard ||
  !iosLive2DUrlShaderLoader || !iosLive2DReleasesShaderLibraries ||
  !iosLive2DDataTextureLoader || !iosLive2DBlendFallback

const hasPublicApiKey = /^\s*NEXT_PUBLIC_.*(?:API_KEY|SECRET|TOKEN)\s*=/m.test(envLocal)
if (hasPublicApiKey) {
  todo(
    'Move public secret-looking env vars',
    'NEXT_PUBLIC_* API keys, secrets, or tokens are visible to the app bundle'
  )
} else {
  mark(true, 'No public API key-style secrets detected in .env.local')
}

const hasEnvExample = existsSync(join(root, '.env.example'))
mark(hasEnvExample, 'Environment template exists', '.env.example')
failed ||= !hasEnvExample

if (failed) {
  console.error('\nMobile preflight failed. Fix the FAIL items before opening Xcode or Android Studio.')
  process.exit(1)
}

console.log('\nMobile preflight passed. Official SDK folders can still be added when the Live2D download is ready.')
