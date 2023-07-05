//cSpell:disable
const knex = require('knex')
const config = require('../knexfile')
const db = knex(config.development)
const { scWorkAllData } = require('../scraper/dlsite')

/**
 * This method will not check for the repeat rjcode.
 * 
 * Need to check the duplicate rjcode before using 
 * this method.
 * @param {object} work Work object
 * @returns 
 */
const insertWorkTodb = work => db.transaction(trx => 
    trx('ys')
    .insert({
        rj_code: work.workno,
        alt_rj_code: work.alt_rj_code,
        work_title: work.work_name,
        work_directory: '/something',
        work_main_img: work.main_img,
        circle_id: work.circle_id,
        nsfw: work.nsfw,
        official_price: work.official_price,
        dl_count: work.dl_count,
        regist_date: work.regist_date,
        rate_count: work.rate_count,
        rate_average_2dp: work.rate_average_2dp,
        rate_count_detail: work.rate_count_detail
    })
    .onConflict().ignore()
    .then(() => {
        
        const promises = []

        // console.log("RJCODE: " + work.workno);

        for (let i = 0; i < work.genres.length; i++) {
            promises.push(
                trx('t_tag_id')
                .insert({
                    id: work.genres[i].id,
                    tag_name: work.genres[i].name
                })
                .onConflict().ignore()
                .then(() => 
                    trx('t_tag')
                    .insert({
                        tag_id: work.genres[i].id,
                        tag_rjcode: work.workno
                    })
                )
            )
        }

        promises.push(
            trx('t_circle')
            .insert({
                id: work.circle_id,
                circle_name: work.maker_name
            })
            .onConflict('circle_name').ignore()
        )

        return Promise.all(promises).then(() => trx)
    })
)

async function getWorksData(rjcode) {
    const workdata = await scWorkAllData(rjcode)
    return insertWorkTodb(workdata)
    .then(() => {
        console.log(`${rjcode} has been added to db`);
        return 'added'
    })
    .catch(err => {
        // console.log(`Adding ${rjcode} to db failed with error message: ${err}`)
        // console.log(err.message);
        return err.message
    })
}

module.exports = {
    getWorksData
};
