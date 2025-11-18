import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { config } from '../config'
import * as schema from './schema'

// Create postgres connection with connection pool settings
// Using lower max connections for Supabase Session mode pooler
const queryClient = postgres(config.database.url, {
  max: 3, // Limit connections to avoid exhausting Supabase pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
})

// Create drizzle instance
export const db = drizzle(queryClient, { schema })

export * from './schema'
