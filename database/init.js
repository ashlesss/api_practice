const { config } = require('../config')
const fs = require("fs-extra")
const path = require('node:path');
const { createSchema } = require('./schema')
const { addUser } = require('./users')
const { db } = require('./metadata')

const databaseExists = fs.existsSync(path.join(config.db_path, 'ys.sqlite3'))

async function initApp() {
    function initDatabaseDir() {
        const databaseFolderDir = config.db_path
        if (!fs.existsSync(databaseFolderDir)) {
            try {
                fs.mkdirSync(databaseFolderDir, { recursive: true });
            }
            catch(err) {
                console.error(`Creating database folder error ${err.message}`);
            }
        }
    }

    async function runMigrations() {
        await db.migrate.latest()
    }

    if (!databaseExists) {
        initDatabaseDir()
        await createSchema()
        await runMigrations()
        try {
            await addUser({
                username: 'admin',
                password: '12345a',
                group: 'admin'
            })
        }
        catch(err) {
            console.error(err);
            process.exit(1)
        }
    }
    else {
        await runMigrations()
    }
}

module.exports = {
    initApp
}