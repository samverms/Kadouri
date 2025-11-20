import { db } from './src/db'
import { agents, brokers } from './src/db/schema'

async function test() {
  console.log('\n=== TESTING AGENTS AND BROKERS ===\n')

  const allAgents = await db.select().from(agents)
  console.log('AGENTS:')
  console.log(JSON.stringify(allAgents, null, 2))
  console.log('\nTotal agents:', allAgents.length)

  console.log('\n---\n')

  const allBrokers = await db.select().from(brokers)
  console.log('BROKERS:')
  console.log(JSON.stringify(allBrokers, null, 2))
  console.log('\nTotal brokers:', allBrokers.length)

  console.log('\n=== END ===\n')
  process.exit(0)
}

test()
