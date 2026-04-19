import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

const normalizeDatabaseUrl = (rawUrl?: string) => {
  if (!rawUrl) {
    return undefined
  }

  try {
    const url = new URL(rawUrl)
    const isSupabaseTransactionPooler =
      url.hostname.includes('.pooler.supabase.com') && url.port === '6543'

    if (isSupabaseTransactionPooler && !url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'true')
    }
    return url.toString()
  } catch {
    return rawUrl
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const normalizedDatabaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL)

    super(
      normalizedDatabaseUrl
        ? {
            datasources: {
              db: {
                url: normalizedDatabaseUrl
              }
            }
          }
        : undefined
    )
  }

  async onModuleInit() {
    await this.$connect()
  }
}
