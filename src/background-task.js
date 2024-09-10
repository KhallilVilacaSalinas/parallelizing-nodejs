import { getPostgresConnection } from './db.js'
const db = await getPostgresConnection()

process.on('message', (items) => {
    for (const item of items) {
        db.students.insert(item)
            .then(() => {
                process.send('item-done');
            })
            .catch((error) => {
                console.error(error);
            });
    }
});
