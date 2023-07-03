//cSpell:disable
const knex = require('knex')
const config = require('../knexfile')
const { promises, truncate } = require('fs-extra')
const db = knex(config.development)


module.exports = {
    insertMeatadata
}

async function insertMeatadata(metajson, salesjson, workDir, imgName) {
    try {
        await db.transaction(async trx => {
            // console.log(salesjson);
            await trx('ys')
            .insert({
                rj_code: metajson[0].workno,
                alt_rj_code: Number(metajson[0].workno.slice(2)), 
                work_title: metajson[0].work_name, 
                work_directory: workDir,
                work_main_img: imgName,

                circle_id: Number(metajson[0].circle_id.slice(2)),
                nsfw: isNsfw(metajson[0].age_category_string),
                official_price: metajson[0].official_price,
                regist_date: metajson[0].regist_date,
                dl_count: salesjson[metajson[0].workno].dl_count,
                rate_count: salesjson[metajson[0].workno].rate_count,
                rate_average_2dp: salesjson[metajson[0].workno].rate_average_2dp,
                rate_count_detail: metajson[0].rate_count_detail,
            })
            .onConflict().ignore()
            // console.log(metajson[0].genres.length);
    
            for(let i = 0; i < metajson[0].genres.length; i++) {
                await trx('t_tag_id')
                .insert({
                    id: metajson[0].genres[i].id,
                    tag_name: metajson[0].genres[i].name
                })
                .onConflict().ignore()

                await trx('t_tag')
                .insert({
                    tag_id: metajson[0].genres[i].id,
                    tag_rjcode: metajson[0].workno
                })
            }

            await trx('t_circle')
            .insert({
                id: Number(metajson[0].circle_id.slice(2)),
                circle_name: metajson[0].maker_name
            })
            .onConflict('id').ignore()
        })
    } catch(e) {
        console.log(e);
    }
    
}

function isNsfw(nsfw) {
    if (nsfw === 'adult') {
        return true
    }
    else {
        return false
    }
}
