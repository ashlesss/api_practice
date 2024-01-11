//cSpell:disable
const { config } = require('../config')
const knex = require('knex')
// const dbEnv = config.production ? 'production' : 'development'
const Config = require('../knexfile')['development']
const db = knex(Config)
const { scWorkAllData, scGetSaledata } = require('../scraper/dlsite')

/**
 * This method will not check for the duplicate rjcode.
 * If duplicate work in db, it will ignore the work.
 * Work inside the db will stay untouched.
 * 
 * @param {object} work Work object
 * @param {string} workdir work's directory
 * @returns 
 */
const insertWorkTodb = (work, workdir, userSetRootDir) => db.transaction(trx => 
    trx('ys')
    .transacting(trx)
    .insert({
        rj_code: work.workno,
        alt_rj_code: work.alt_rj_code,
        work_title: work.work_name,
        work_dir: workdir,
        userset_rootdir: userSetRootDir,
        work_main_img: work.main_img,
        circle_id: work.circle_id,
        nsfw: work.nsfw,
        official_price: work.official_price,
        dl_count: work.dl_count,
        regist_date: work.regist_date,
        rate_count: work.rate_count,
        rate_average_2dp: work.rate_average_2dp,
        rate_count_detail: work.rate_count_detail,
        has_subtitle: work.has_subtitle,
        language_editions: work.language_editions
    })
    .onConflict().ignore()
    .then(() => {
        const promises = []

        // Add tags to work
        if (work.genres) {
            const genres = JSON.parse(work.genres)
            for (let i = 0; i < genres.length; i++) {
                promises.push(
                    trx('t_tag_id')
                    .transacting(trx)
                    .insert({
                        id: genres[i].id,
                        tag_name: genres[i].name,
                        en_us: processdGenres(work.enGenres, genres[i]),
                        ja_jp: genres[i].name_base,
                        zh_cn: genres[i].name
                    })
                    .onConflict().ignore()
                    .then(() => 
                        trx('t_tag')
                        .transacting(trx)
                        .insert({
                            tag_id: genres[i].id,
                            tag_rjcode: work.workno
                        })
                        .onConflict().ignore()
                    )
                )
            }
        }
        

        promises.push(
            trx('t_circle')
            .transacting(trx)
            .insert({
                id: work.circle_id,
                circle_name: work.maker_name
            })
            .onConflict().ignore()
        )


        // Add va to work
        if (work.va) {
            const va = JSON.parse(work.va)
            for (let i = 0; i < va.length; i++) {
                promises.push(
                    trx('t_va_id')
                    .transacting(trx)
                    .insert({
                        id: va[i].id,
                        va_name: va[i].name
                    })
                    .onConflict().ignore()
                    .then(() => 
                        trx('t_va')
                        .transacting(trx)
                        .insert({
                            va_id: va[i].id,
                            va_rjcode: work.workno
                        })
                        .onConflict().ignore()
                    )
                )
            }
        }

        return Promise.all(promises)
    })
)

/**
 * Process mutli languages genres compare target genres their genres id
 * if it the same return them
 * 
 * @param {string[]} targetGenres 
 * @param {string} compareGenres 
 * @returns genre name
 */
const processdGenres = (targetGenres, compareGenres) => {
    if (targetGenres) {
        return JSON.parse(targetGenres).find(e => e.id === compareGenres.id).name
    }

    return null
}

/**
 * Fetching work's metadata, add work and its metadata into the data base.
 * @param {string} rjcode RJcode
 * @param {string} workdir work's directory
 * @param {string} userSetRootDir user set root dir
 * @returns added if success or return err message
 */
const getWorksData = (rjcode, workdir, userSetRootDir) => {
    return scWorkAllData(rjcode)
    .then(workdata => {
        return insertWorkTodb(workdata, workdir, userSetRootDir)
        .then(() => {
            // console.log(`${rjcode} has been added to db`);
            return 'added'
        })
        // .catch(err => {
        //     return err.message
        // })
    })
    .catch(err => {
        return err.message
    })
}

/**
 * Insert updated saledata into the database for
 * the requested RJcode
 * @param {string} rjcode 
 * @param {object} saledata 
 */
const updateWorkSaledata = (rjcode, saledata) => 
    db.transaction(async trx => {
        await trx('ys')
        .where({rj_code: rjcode})
        .update({
            dl_count: saledata.dl_count,
            rate_count: saledata.rate_count,
            rate_average_2dp: saledata.rate_average_2dp,
            rate_count_detail: saledata.rate_count_detail
        })
    })

/**
 * Update saledata: dl_count, rate_count, rate_count_detail, rate_average_2dp
 * @param {string} rjcode RJcode 
 * @returns updated when success, error message when fail.
 */
const updateSaledata = rjcode => {
    return scGetSaledata(rjcode)
    .then(saledata => {
        // console.log(saledata);
        return updateWorkSaledata(rjcode, saledata)
        .then(() => {
            return 'updated'
        })
    })
    .catch(err => {
        return(`Updating saledata faile: ${err.message}`);
    })
}

/**
 * 
 * @param {string} rjcode RJ code
 * @param {string} newDir Work's new directory 
 * @returns 
 */
const updateWorkDir = (rjcode, newDir) => db.transaction(trx => 
    trx('ys')
    .update({
        work_directory: newDir
    })
    .where({rj_code: rjcode})
)

/**
 * 
 * @param {string} rjcode 
 * @param {string} filename 
 * @param {float} duration 
 * @param {string} mtimeMs 
 * @param {string} filepath 
 * @returns 
 */
const insertMediaDuration = (rjcode, filename, duration, mtimeMs, filepath) => 
db.transaction(trx => 
    trx('t_track_duration')
    .transacting(trx)
    .insert({
        rj_code: rjcode,
        file_name: filename,
        duration: duration,
        mtime_ms: mtimeMs,
        file_path: filepath
    })
    .onConflict(['rj_code', 'file_path'])
    .merge()
)

module.exports = {
    getWorksData,
    updateSaledata,
    updateWorkSaledata,
    db,
    updateWorkDir,
    insertWorkTodb,
    insertMediaDuration
};
