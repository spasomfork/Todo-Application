const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDb() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root', // Assuming default from docker-compose, checking if user has same local
      multipleStatements: true
    });

    console.log('Connected to MySQL server');

    await connection.query('CREATE DATABASE IF NOT EXISTS todoapp');
    console.log('Database todoapp created or exists');

    await connection.changeUser({ database: 'todoapp' });

    const sqlPath = path.join(__dirname, '..', 'Database', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await connection.query(sql);
    console.log('Database initialized with init.sql');

    await connection.end();
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

initDb();
