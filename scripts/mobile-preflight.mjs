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

if (failed) {
  console.error('\nMobile preflight failed. Fix the FAIL items before opening Xcode or Android Studio.')
  process.exit(1)
}

console.log('\nMobile preflight passed. Official SDK folders can still be added when the Live2D download is ready.')
