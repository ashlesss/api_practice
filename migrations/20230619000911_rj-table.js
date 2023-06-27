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
      // tbl.integer('circle_id').notNullable()
      // tbl.foreign('circle_id').references('id').inTable('t_circle')
      // tbl.boolean('nsfw')
      // tbl.integer('official_price')
      // tbl.integer('dl_count')
      // tbl.string('regist_date')
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
    // .createTable('t_circle', tbl => {
    //   tbl.increments().notNullable()
    //   tbl.string('circle_name').notNullable().primary()
    // })
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('ys')
    .dropTableIfExists('t_tag')
    .dropTableIfExists('t_tag_id')
    // .dropTableIfExists('t_circle')
  };
  