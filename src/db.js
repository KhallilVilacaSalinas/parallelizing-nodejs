import pg from 'pg';
const { Client } = pg;

async function getPostgresConnection() {
    const client = new Client({
        user: 'root',
        host: 'localhost',
        database: 'school',
        password: 'root',
        port: 5432,
    });

    await client.connect();
    return {
        client,
        students: {
            async insert(person) {
                const { name, unique_key, age, description, observation, cellphone, type } = person;
                const query = 'INSERT INTO students (name, unique_key, age, description, observation, cellphone, type, registered_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())';
                const values = [name, unique_key, age, description, observation, cellphone, type];
    
                await client.query(query, values);
            },
            async list(limit = 100) {
                const query = 'SELECT * FROM students LIMIT $1';
                const values = [limit];

                const result = await client.query(query, values);
                return result.rows;

            },
            async count() {
                const query = 'SELECT COUNT(*) as total FROM students';

                const result = await client.query(query);
                return Number(result.rows[0].total);

            },
            async deleteAll() {
                const query = 'DELETE FROM students';

                await client.query(query);
            },
            async createTable() {
                const createStudentsTableQuery = `
                    CREATE TABLE IF NOT EXISTS students (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        unique_key VARCHAR(255) NOT NULL,
                        age INT NOT NULL,
                        description TEXT,
                        observation TEXT,
                        cellphone VARCHAR(20),
                        type VARCHAR(50),
                        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )`;
                await client.query(createStudentsTableQuery);

            }
        }
    };
}

export { getPostgresConnection };
