//cSpell:disable
const { config } = require('../config')
const knex = require('knex')
const dbEnv = config.production ? 'production' : 'development'
const Config = require('../knexfile')[dbEnv]
const db = knex(Config)
const { scWorkAllData, scGetSaledata } = require('../scraper/dlsite')
const { getWorkTrack } = require('../filesystem/utils')
const path = require('node:path');
const promiseLimit = require('promise-limit')
const { prcSend } = require('../filesystem/utils')

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
        has_subtitle: work.has_subtitle
    })
    .onConflict().ignore()
    .then(() => {
        
        const promises = []

        // Add tags to work
        const genres = JSON.parse(work.genres)
        for (let i = 0; i < genres.length; i++) {
            promises.push(
                trx('t_tag_id')
                .transacting(trx)
                .insert({
                    id: genres[i].id,
                    tag_name: genres[i].name
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

        promises.push(
            trx('t_circle')
            .transacting(trx)
            .insert({
                id: work.circle_id,
                circle_name: work.maker_name
            })
            .onConflict('circle_name').ignore()
        )


        // Add va to work
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

        return Promise.all(promises)
        .then(() => trx.commit())
        .catch(err => {
            console.error(err)
            return trx.rollback()
        })
    })
)
.then(async () => {
    const rootFolder = config.rootFolders.find(rootFolder => rootFolder.name === userSetRootDir);
    const tracks = await getWorkTrack(work.workno, path.join(rootFolder.path, workdir));
    
    await db('t_tracks').insert({
        track_rjcode: work.workno,
        tracks: JSON.stringify(tracks)
    });
})

/**
 * Fetching work's metadata, add work and its metadata into the data base.
 * @param {string} rjcode RJcode
 * @param {string} workdir work's directory
 * @returns added if success or return err message
 */
const getWorksData = (rjcode, workdir, userSetRootDir) => {
    return scWorkAllData(rjcode)
    .then(workdata => {
        if (typeof workdata.va !== 'undefined') {
            return insertWorkTodb(workdata, workdir, userSetRootDir)
            .then(() => {
                // console.log(`${rjcode} has been added to db`);
                return 'added'
            })
            .catch(err => {
                return err.message
            })
        }
        else {
            throw new Error(`${rjcode} failed to find any VAs info, Skipped!`)
        }
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
 * Update all the work's tracks info.
 * Ready for process.fork()
 */
const updateAllWorksDuration = () => {
    db('works_w_metadata')
    .select('rj_code', 'work_title', 'work_dir', 'userset_rootdir')
    .then(works => {
        const limit = promiseLimit(config.maxParallelism ? config.maxParallelism : 16)
        const limitedGetWorkTrakcs = (rjcode, dir) => {
            return limit(() => getWorkTrack(rjcode, dir))
        }

        let count = {
            updated: 0,
            failed: 0
        }

        let validWorks = []
        // Remove works that are not belong to rootFolder
        works.map(work => {
            const rootFolder = config.rootFolders.find(rootFolder => rootFolder.name === work.userset_rootdir);
            if (rootFolder) {
                validWorks.push(work)
            }
        })

        const promises = validWorks.map(work => {
            const rootFolder = config.rootFolders.find(rootFolder => rootFolder.name === work.userset_rootdir);
            return limitedGetWorkTrakcs(work.rj_code, path.join(rootFolder.path, work.work_dir))
            .then(result => {
                if (result !== 'failed') {
                    prcSend(`${work.rj_code} tracks updated.`)
                    count.updated++
                }
                else {
                    prcSend(`${work.rj_code} tracks update failed.`)
                    count.failed++
                }
            })
        })

        return Promise.all(promises)
        .then(() => {
            const msg = `Updating tracks completed: updated: ${count.updated}\n`
            + `failed: ${count.failed}.`
            prcSend({status: 'UPDATE_TRACKS_COMPLETED', message: msg})

            process.exit(0)
        })
        .catch(err => {
            if (err.code === 'ENOENT') {
                prcSend(`Error code: "${err.code}", on path: "${err.path}". `
                + `Check the path if the path exists in your system or not.`)
            }
            else {
                prcSend('Updating tracks error')
            }

            process.exit(1)
        }) 
    })
    .catch(err => {
        prcSend(`Updating tracks error when querying on database, err: ${err.stack}`)
        process.exit(1)
    })
}

module.exports = {
    getWorksData,
    updateSaledata,
    updateWorkSaledata,
    db,
    updateWorkDir,
    updateAllWorksDuration
};
