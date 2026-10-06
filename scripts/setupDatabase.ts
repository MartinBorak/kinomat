import { connectToDatabase } from 'kinomat-core/db/client'
import { migrateDatabase } from 'kinomat-core/db/migrate'
import { seedCinemas } from 'kinomat-core/db/seed'

/*
 * Brings a database up to date and mirrors the cinema registry into it. Both steps are idempotent,
 * so this is what a fresh clone runs once and what the CI build runs against an empty Postgres.
 */
async function main(): Promise<void> {
  await migrateDatabase()
  console.log('Applied every migration')

  const database = connectToDatabase()

  try {
    await seedCinemas(database)
    console.log('Seeded the cinema registry')
  } finally {
    await database.close()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
