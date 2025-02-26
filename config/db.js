const mysql = require('mysql2/promise');
let connection;

async function connectDB() {
    try {
        connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DB
        });
        console.log('MySQL connecté');
        return connection;
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

async function executeQuery(query, args) {
    // if connexion closed, reconnect
    if (connection.state === 'disconnected') {
        await connectDB();
        await connection.connect();
    }

    try {
        const [result, fields] = await connection.query(query, args);
        if (typeof result.insertId !== 'undefined') {
            return result;
        } else {
            return (Array.isArray(result) && result.length) ? result : [null];
        }
    } catch (err) {
        throw err;
    }
}

module.exports = { connectDB, executeQuery };
