const { db } = require('./metadata')

const createSchema = () => db.schema
.createTable('t_circle', tbl => {
    tbl.integer('id').primary()
    tbl.string('circle_name').notNullable()
})
.createTable('ys', tbl => {
    tbl.string('rj_code').notNullable()
    tbl.integer('alt_rj_code').notNullable()
    tbl.string('work_title').notNullable()
    tbl.string('userset_rootdir').notNullable()
    tbl.string('work_dir').notNullable()
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
    tbl.text('language_editions')
    tbl.boolean('available')
    tbl.timestamps(true, true)

    tbl.foreign('circle_id').references('id').inTable('t_circle')
    tbl.primary('rj_code')
})
.createTable('t_tag_id', tbl => {
    tbl.integer('id').primary()
    tbl.string('tag_name').notNullable()
    tbl.string('en_us')
    tbl.string('ja_jp')
    tbl.string('zh_cn')
})
.createTable('t_tag', tbl => {
    tbl.integer('tag_id')
    tbl.string('tag_rjcode')
    
    tbl.foreign('tag_id').references('id').inTable('t_tag_id')
    tbl.foreign('tag_rjcode').references('rj_code').inTable('ys').onDelete('CASCADE')
    tbl.primary(['tag_id', 'tag_rjcode'])
})
.createTable('t_va_id', tbl => {
    tbl.integer('id').primary()
    tbl.string('va_name').notNullable()
})
.createTable('t_va', tbl => {
    tbl.integer('va_id')
    tbl.string('va_rjcode')

    tbl.foreign('va_id').references('id').inTable('t_va_id')
    tbl.foreign('va_rjcode').references('rj_code').inTable('ys').onDelete('CASCADE')
    tbl.primary(['va_id', 'va_rjcode'])
})
.createTable('t_user', tbl => {
    tbl.increments('userId').primary()
    tbl.string('username', 128).notNullable().unique()
    tbl.string('password', 255).notNullable()
    tbl.text('group').notNullable()
})
.createTable('t_track_duration', tbl => {
	tbl.string('rj_code')
	tbl.string('file_name')
	tbl.float('duration')
	tbl.string('mtime_ms')
	tbl.text('file_path')

	tbl.foreign('rj_code').references('rj_code').inTable('ys').onDelete('CASCADE')
	tbl.primary([
		'rj_code', 'file_path'
	])
})
// works_w_metadata
.raw(`
CREATE OR REPLACE VIEW works_w_metadata
AS
SELECT ys.rj_code,
ys.alt_rj_code,
ys.work_title,
ys.userset_rootdir,
ys.work_dir,
ys.work_main_img,
ys.circle_id,
ys.nsfw,
ys.official_price,
ys.dl_count,
ys.regist_date,
ys.rate_count,
ys.rate_average_2dp,
ys.rate_count_detail,
ys.has_subtitle,
ys.language_editions,
ys.created_at,
ys.updated_at,
basequeryall.circleobj,
basequeryall.tags,
basequeryall.vas
FROM ys
 JOIN ( SELECT basequerywithva.rj_code,
		basequerywithva.circleobj,
		basequerywithva.vas,
		jsonb_build_object('tags', jsonb_agg(jsonb_build_object('tag_id', t_tag_id.id, 'i18n', jsonb_build_object('en_us', t_tag_id.en_us, 'ja_jp', t_tag_id.ja_jp, 'zh_cn', t_tag_id.zh_cn), 'tag_name', t_tag_id.tag_name))) AS tags
	   FROM ( SELECT basequery.rj_code,
				basequery.circleobj,
				jsonb_build_object('vas', jsonb_agg(jsonb_build_object('va_id', t_va_id.id, 'va_name', t_va_id.va_name))) AS vas
			   FROM ( SELECT ys_1.rj_code,
						jsonb_build_object('circle_id', ys_1.circle_id, 'circle_name', t_circle.circle_name) AS circleobj
					   FROM ys ys_1
						 JOIN t_circle ON t_circle.id = ys_1.circle_id) basequery
				 LEFT JOIN t_va ON t_va.va_rjcode::text = basequery.rj_code::text
				 LEFT JOIN t_va_id ON t_va_id.id = t_va.va_id
			  GROUP BY basequery.rj_code, basequery.circleobj) basequerywithva
		 LEFT JOIN t_tag ON t_tag.tag_rjcode::text = basequerywithva.rj_code::text
		 LEFT JOIN t_tag_id ON t_tag_id.id = t_tag.tag_id
	  GROUP BY basequerywithva.rj_code, basequerywithva.circleobj, basequerywithva.vas) basequeryall ON basequeryall.rj_code::text = ys.rj_code::text
ORDER BY ys.alt_rj_code

`)
// works_w_metadata_public 
.raw(
    `
    CREATE OR REPLACE VIEW works_w_metadata_public
    AS
	SELECT ys.rj_code,
    ys.alt_rj_code,
    ys.work_title,
    ys.userset_rootdir,
    ys.work_dir,
    ys.work_main_img,
    ys.circle_id,
    ys.nsfw,
    ys.official_price,
    ys.dl_count,
    ys.regist_date,
    ys.rate_count,
    ys.rate_average_2dp,
    ys.rate_count_detail,
    ys.has_subtitle,
    ys.language_editions,
    ys.created_at,
    ys.updated_at,
    basequeryall.circleobj,
    basequeryall.tags,
    basequeryall.vas
   FROM ys
     JOIN ( SELECT basequerywithva.rj_code,
            basequerywithva.circleobj,
            basequerywithva.vas,
            jsonb_build_object('tags', jsonb_agg(jsonb_build_object('tag_id', t_tag_id.id, 'i18n', jsonb_build_object('en_us', t_tag_id.en_us, 'ja_jp', t_tag_id.ja_jp, 'zh_cn', t_tag_id.zh_cn), 'tag_name', t_tag_id.tag_name))) AS tags
           FROM ( SELECT basequery.rj_code,
                    basequery.circleobj,
                    jsonb_build_object('vas', jsonb_agg(jsonb_build_object('va_id', t_va_id.id, 'va_name', t_va_id.va_name))) AS vas
                   FROM ( SELECT ys_1.rj_code,
                            jsonb_build_object('circle_id', ys_1.circle_id, 'circle_name', t_circle.circle_name) AS circleobj
                           FROM ys ys_1
                             JOIN t_circle ON t_circle.id = ys_1.circle_id) basequery
                     LEFT JOIN t_va ON t_va.va_rjcode::text = basequery.rj_code::text
                     LEFT JOIN t_va_id ON t_va_id.id = t_va.va_id
                  GROUP BY basequery.rj_code, basequery.circleobj) basequerywithva
             LEFT JOIN t_tag ON t_tag.tag_rjcode::text = basequerywithva.rj_code::text
             LEFT JOIN t_tag_id ON t_tag_id.id = t_tag.tag_id
          GROUP BY basequerywithva.rj_code, basequerywithva.circleobj, basequerywithva.vas) basequeryall ON basequeryall.rj_code::text = ys.rj_code::text
  ORDER BY ys.alt_rj_code
    `
)
.then(() => {
    console.log('Database schema created successful.');
})
.catch(err => {
    if (err.toString().indexOf('create table "t_circle"') !== -1) {
        console.log('[Init database] Database schema already existed');
    }
    else {
        throw err
    }
})

module.exports = {
    createSchema
}