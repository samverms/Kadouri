import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { config } from '../config'
import * as schema from './schema'

// Create postgres connection
const queryClient = postgres(config.database.url)

// Create drizzle instance
export const db = drizzle(queryClient, { schema })

export * from './schema'
