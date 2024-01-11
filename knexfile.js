// Update with your config settings.
const { config } = require('./config')
const path = require('node:path');
require('dotenv').config()

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  // development: {
  //   client: 'sqlite3',
  //   connection: {
  //     filename: path.join(config.db_path, 'ys.sqlite3'),
  //   },
  //   useNullAsDefault: true,
  //   migrations: {
  //     tableName: 'knex_migrations',
  //   }
  // },

  development: {
    client: 'pg',
    connection: {
      database: process.env.PG_DATABASE_NAME ?? 'ys',
      user: process.env.PG_USER ?? 'me',
      password: process.env.PG_PASSWORD ?? '12345678'
    },
  }

  // staging: {
  //   client: 'postgresql',
  //   connection: {
  //     database: 'my_db',
  //     user:     'username',
  //     password: 'password'
  //   },
  //   pool: {
  //     min: 2,
  //     max: 10
  //   },
  //   migrations: {
  //     tableName: 'knex_migrations'
  //   }
  // },

  // production: {
  //   client: 'postgresql',
  //   connection: {
  //     database: 'my_db',
  //     user:     'username',
  //     password: 'password'
  //   },
  //   pool: {
  //     min: 2,
  //     max: 10
  //   },
  //   migrations: {
  //     tableName: 'knex_migrations'
  //   }
  // }

};
