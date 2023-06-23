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
      tbl.string('work_main_img')
      tbl.timestamps(true, true)
    })
    .createTable('t_tag_id', tbl => {
      tbl.increments()
      tbl.string('tag_name').notNullable().primary()
    })
    .createTable('t_tag', tbl => {
      // tbl.string('tag')
      tbl.integer('tag_id')
      tbl.string('tag_rjcode')
      tbl.foreign('tag_id').references('id').inTable('t_tag_id')
      tbl.foreign('tag_rjcode').references('rjcode').inTable('ys')
      tbl.primary(['tag_id', 'tag_rjcode'])
    })
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('ys')
    .dropTableIfExists('t_tag')
    .dropTableIfExists('t_tag_id')
  };
  