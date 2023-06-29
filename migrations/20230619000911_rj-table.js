/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('ys', tbl => {
      tbl.string('rj_code').notNullable()
      tbl.integer('alt_rj_code').notNullable()
      tbl.string('work_title').notNullable()
      tbl.string('work_directory').notNullable()
      tbl.string('work_main_img')
      tbl.integer('circle_id')
      tbl.boolean('nsfw')
      tbl.integer('official_price')
      tbl.integer('dl_count')
      tbl.string('regist_date')
      tbl.integer('rate_count')
      tbl.float('rate_average_2dp')
      tbl.string('rate_count_detail')
      tbl.timestamps(true, true)

      tbl.foreign('circle_id').references('id').inTable('t_circle')
      tbl.primary('rj_code')
    })
    .createTable('t_tag_id', tbl => {
      tbl.integer('id').primary()
      tbl.string('tag_name').notNullable()
    })
    .createTable('t_tag', tbl => {
      tbl.integer('tag_id')
      tbl.string('tag_rjcode')
      
      tbl.foreign('tag_id').references('id').inTable('t_tag_id')
      tbl.foreign('tag_rjcode').references('rjcode').inTable('ys')
      tbl.primary(['tag_id', 'tag_rjcode'])
    })
    .createTable('t_circle', tbl => {
      tbl.increments()
      tbl.string('circle_name').notNullable().primary()
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
    .dropTableIfExists('t_circle')
  };
  