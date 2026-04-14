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

const usesAlexiaOriginal = live2dModels.includes("path: '/models/Alexia/Alexia.model3.json'")
const usesAsukaOriginal = live2dModels.includes("path: '/models/ASUKA/Asuka.model3.json'")
mark(usesAlexiaOriginal, 'App points Alexia to creator original')
mark(usesAsukaOriginal, 'App points Asuka to creator original')
failed ||= !usesAlexiaOriginal || !usesAsukaOriginal

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
mark(iosBundlesModels, 'iOS bundles original Live2D model folder')
mark(iosLinksLive2DCore, 'iOS links official Live2D Cubism Core')
mark(iosUsesBridgeHeader, 'iOS exposes Live2D bridge to Swift')
mark(iosCompilesNativeLive2DView, 'iOS compiles native Live2D Metal view')
mark(iosCompilesOfficialLive2DMetal, 'iOS compiles official Live2D Framework Metal renderer')
failed ||= !iosBundlesModels || !iosLinksLive2DCore || !iosUsesBridgeHeader ||
  !iosCompilesNativeLive2DView || !iosCompilesOfficialLive2DMetal

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
