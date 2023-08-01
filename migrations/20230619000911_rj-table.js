//cSpell:disable
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('ys', tbl => {
      tbl.string('rj_code').notNullable()
      tbl.integer('alt_rj_code').notNullable()
      tbl.string('work_title').notNullable()
      tbl.string('userset_rootdir').notNullable()
      tbl.string('work_foldername').notNullable()
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
      tbl.boolean('has_subtitle')
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
      tbl.foreign('tag_rjcode').references('rj_code').inTable('ys')
      tbl.primary(['tag_id', 'tag_rjcode'])
    })
    .createTable('t_circle', tbl => {
      tbl.integer('id')
      tbl.string('circle_name').notNullable().primary()
    })
    .createTable('t_va_id', tbl => {
      tbl.integer('id').primary()
      tbl.string('va_name').notNullable()
    })
    .createTable('t_va', tbl => {
      tbl.integer('va_id')
      tbl.string('va_rjcode')

      tbl.foreign('va_id').references('id').inTable('t_va_id')
      tbl.foreign('va_rjcode').references('rj_code').inTable('ys')
      tbl.primary(['va_id', 'va_rjcode'])
    })
    .raw(`
    CREATE VIEW IF NOT EXISTS works_w_metadata
    AS
    SELECT baseQueryWithVA.*,
      json_object('tags', json_group_array(json_object('tag_id', t_tag_id.id, 'tag_name', t_tag_id.tag_name))) AS tags
    FROM (
      SELECT baseQuery.*,
        json_object('vas', json_group_array(json_object('va_id', t_va_id.id, 'va_name', t_va_id.va_name))) AS vas
      FROM (
        SELECT ys.rj_code,
        ys.alt_rj_code,
        ys.work_title,
        ys.work_main_img,
        ys.circle_id,
        t_circle.circle_name,
        json_object('circle_id', ys.circle_id, 'circle_name', t_circle.circle_name) AS circleObj,
        ys.nsfw,
        ys.official_price,
        ys.dl_count,
        ys.regist_date,
        ys.rate_count,
        ys.rate_average_2dp,
        ys.rate_count_detail,
        ys.has_subtitle
      FROM ys
      JOIN t_circle ON t_circle.id = ys.circle_id
      ) AS baseQuery
      JOIN t_va ON t_va.va_rjcode = baseQuery.rj_code
      JOIN t_va_id ON t_va_id.id = t_va.va_id
      GROUP BY baseQuery.rj_code
    ) AS baseQueryWithVA
    LEFT JOIN t_tag ON t_tag.tag_rjcode = baseQueryWithVA.rj_code
    LEFT JOIN t_tag_id ON t_tag_id.id = t_tag.tag_id
    GROUP BY baseQueryWithVA.rj_code
    `)
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
    .dropTableIfExists('t_va')
    .dropTableIfExists('t_va_id')
    .dropViewIfExists('works_w_metadata')
  };
  