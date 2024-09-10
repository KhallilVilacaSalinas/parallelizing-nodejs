import { getPostgresConnection } from './db.js'

async function seedPostegres() {
    const db = await getPostgresConnection()
    console.log('creating table students')
    await db.students.createTable()
    console.log('table students created with success')
    await db.client.end()
}

await seedPostegres()
