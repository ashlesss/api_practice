/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('ys', tbl => {
      tbl.increments()
      tbl.string('rj_code').notNullable().primary()
      tbl.string('work_title').notNullable()
      tbl.string('work_directory').notNullable()
      tbl.timestamps(true, true)
    })
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('ys')
  };
  