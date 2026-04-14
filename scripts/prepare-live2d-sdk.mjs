import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { basename, join } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const zipPath = process.argv[2] ?? join(process.env.HOME ?? '', 'Downloads/CubismSdkForNative-5-r.5.zip')
const extractRoot = join(root, 'vendor/live2d/sdk-source')
const sourceDir = join(extractRoot, basename(zipPath, '.zip'))
const iosDir = join(root, 'vendor/live2d/ios')
const androidDir = join(root, 'vendor/live2d/android')

function fail(message) {
  console.error(message)
  process.exit(1)
}

if (!existsSync(zipPath)) {
  fail(`Live2D SDK zip not found: ${zipPath}`)
}

rmSync(extractRoot, { force: true, recursive: true })
rmSync(iosDir, { force: true, recursive: true })
rmSync(androidDir, { force: true, recursive: true })
mkdirSync(extractRoot, { recursive: true })

const unzip = spawnSync('unzip', ['-q', zipPath, '-d', extractRoot], {
  encoding: 'utf8',
})

if (unzip.status !== 0) {
  fail(unzip.stderr || 'Unable to unzip Live2D SDK.')
}

if (!existsSync(sourceDir)) {
  fail(`Unexpected SDK folder layout. Missing: ${sourceDir}`)
}

mkdirSync(join(iosDir, 'Core'), { recursive: true })
mkdirSync(join(iosDir, 'Samples'), { recursive: true })
mkdirSync(join(androidDir, 'Core'), { recursive: true })
mkdirSync(join(androidDir, 'Samples'), { recursive: true })

cpSync(join(sourceDir, 'Core/include'), join(iosDir, 'Core/include'), { recursive: true })
cpSync(join(sourceDir, 'Core/lib/ios'), join(iosDir, 'Core/lib'), { recursive: true })
cpSync(join(sourceDir, 'Framework'), join(iosDir, 'Framework'), { recursive: true })
cpSync(join(sourceDir, 'Samples/Metal'), join(iosDir, 'Samples/Metal'), { recursive: true })
cpSync(join(sourceDir, 'LICENSE.md'), join(iosDir, 'LICENSE.md'))
cpSync(join(sourceDir, 'NOTICE.md'), join(iosDir, 'NOTICE.md'))

cpSync(join(sourceDir, 'Core/include'), join(androidDir, 'Core/include'), { recursive: true })
cpSync(join(sourceDir, 'Core/lib/android'), join(androidDir, 'Core/lib'), { recursive: true })
cpSync(join(sourceDir, 'Framework'), join(androidDir, 'Framework'), { recursive: true })
cpSync(join(sourceDir, 'Samples/OpenGL'), join(androidDir, 'Samples/OpenGL'), { recursive: true })
cpSync(join(sourceDir, 'LICENSE.md'), join(androidDir, 'LICENSE.md'))
cpSync(join(sourceDir, 'NOTICE.md'), join(androidDir, 'NOTICE.md'))

console.log(`Prepared local Live2D SDK from ${zipPath}`)
console.log('iOS SDK subset: vendor/live2d/ios')
console.log('Android SDK subset: vendor/live2d/android')
console.log('These folders are ignored by git.')
