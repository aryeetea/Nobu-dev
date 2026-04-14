import { config } from 'dotenv'
import { defineConfig, env } from 'prisma/config'

config({ path: '.env.local' })

export default defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },
  schema: 'prisma/schema.prisma',
})
