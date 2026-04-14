import type { CapacitorConfig } from '@capacitor/cli'

const serverUrl = process.env.CAPACITOR_SERVER_URL ?? 'https://heynobu.netlify.app'

const config: CapacitorConfig = {
  appId: 'com.nobu.app',
  appName: 'Nobu',
  webDir: 'capacitor-web',
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith('http://'),
        },
      }
    : {}),
}

export default config
