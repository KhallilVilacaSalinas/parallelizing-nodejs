import { initialize } from "./cluster.js"
import { getPostgresConnection } from './db.js'
import cliProgress from 'cli-progress'
import fs from 'fs'
import csv from 'csv-parser'
import { setTimeout } from 'node:timers/promises'

const postgresDB = await getPostgresConnection()
const ITEMS_PER_PAGE = 4000
const CLUSTER_SIZE = 80
const path = new URL('./file.csv', import.meta.url).pathname;
const TASK_FILE = new URL('./background-task.js', import.meta.url).pathname

//await postgresDB.students.deleteAll()

async function* getAllPagedData(itemsPerPage, page = 0) {
    let currentItems = []
    let count = 0

    const stream = fs.createReadStream(path).pipe(csv())

    for await (const data of stream) {
        if (count >= page && count < page + itemsPerPage) {
            currentItems.push(data)
        }
        count++
        if (currentItems.length === itemsPerPage) {
            yield currentItems
            yield* getAllPagedData(itemsPerPage, page + itemsPerPage)
            return
        }
    }

    if (currentItems.length) {
        yield currentItems
    }
}

const total = await new Promise((resolve, reject) => {
    let count = 0
    fs.createReadStream(path)
        .pipe(csv())
        .on('data', () => count++)
        .on('end', () => resolve(count))
        .on('error', reject)
})

const progress = new cliProgress.SingleBar({
    format: 'progress [{bar}] {percentage}% | {value}/{total} | {duration}s',
    clearOnComplete: false,
}, cliProgress.Presets.shades_classic);

progress.start(total, 0);
let totalProcessed = 0
const cp = initialize(
    {
        backgroundTaskFile: TASK_FILE,
        clusterSize: CLUSTER_SIZE,
        amountToBeProcessed: total,
        async onMessage(message) {
            progress.increment()

            if (++totalProcessed !== total) return
            // console.log(`all ${amountToBeProcessed} processed! Exiting...`)
            progress.stop()
            cp.killAll()

            const insertedOnSQLite = await postgresDB.students.count()
            console.log(`total on file.csv ${total} and total on PostGres ${insertedOnSQLite}`)
            console.log(`are the same? ${total === insertedOnSQLite ? 'yes' : 'no'}`)
            process.exit()

        }
    }
)
await setTimeout(1000)

for await (const data of getAllPagedData(ITEMS_PER_PAGE)) {
    cp.sendToChild(data)
}
