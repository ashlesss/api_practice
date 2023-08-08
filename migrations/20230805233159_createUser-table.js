/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('t_user', tbl => {
    tbl.increments('userId').primary()
    tbl.text('username', 128).notNullable().unique().index()
    tbl.text('password', 255).notNullable()
    tbl.text('group').notNullable()
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('t_user')
};
