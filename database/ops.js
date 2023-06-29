const knex = require('knex')
const config = require('../knexfile')
const db = knex(config.development)
const fs = require("fs-extra")
const axios = require('axios')
const path = require('node:path');
const { isDuplicate } = require('./query')

module.exports = {
    add,
    delAll,
    
}

// TODO 
// Make rootFolder a dynamic value
// Only read rjcode from the folder name 
// Get work's name from API and write it to database

/**
 * Rate limiting the request 
 * @param {Number} milliseconds 
 */
const sleep = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

async function add() {
    // Test mode 
    // await delAll()

    const rootFolder = '/mnt/hgfs/test/RJ400000/'
    // const rootFolder = '/mnt/hgfs/test/1/'
    const folders = await fs.readdirSync(rootFolder);
    let i = 0
    for ( const folder of folders ) {
        if (folder.match(/RJ\d{8}/)) {
            if (! (await isDuplicate(folder.slice(0, 10)))) {
                const work = {
                    rjcode: folder.slice(0, 10),
                    alt_rj_code: Number(folder.slice(2, 10)), 
                    work_name: "",
                    work_directory: (rootFolder + folder),
                    circleId: [],
                    nsfw: "",
                    imgName: "",
                    official_price: [],
                    regist_date: "",
                    dl_count: [],
                    rate_count: [],
                    rate_average_2dp: [],
                    rate_count_detail: ""
                }

                i++;
                await getWorkMetadata(work.rjcode, work)
                if ((i % 5) === 0) {
                    console.log("Cooldown 2 sec for every 5 requests");
                    await sleep(2000)
                }
            }
            else {
                continue
            }
        }
        else if (folder.match(/RJ\d{6}/)) {
            // for RJ123456
            if (!(await isDuplicate(folder.slice(0, 8)))) {
                const work = {
                    rjcode: folder.slice(0, 8),
                    alt_rj_code: Number(folder.slice(2, 8)), 
                    work_name: "",
                    work_directory: (rootFolder + folder),
                    circleId: [],
                    nsfw: "",
                    imgName: "",
                    official_price: [],
                    regist_date: "",
                    dl_count: [],
                    rate_count: [],
                    rate_average_2dp: [],
                    rate_count_detail: ""
                }

                i++
                await getWorkMetadata(work.rjcode, work)
                if ((i % 5) === 0) {
                    console.log("Cooldown 2 sec for every 5 requests");
                    await sleep(2000)
                }
            }
            else {
                continue
            }
        }
    }
    return await db('ys').count({count: 'rj_code'})
}

// TODO
// May need to consider work don't have tags in Chinese
/**
 * 
 * @param {string} rjcode rjcode string
 * @param {object} work object
 */
async function getWorkMetadata(rjcode , work) {

    // Fetch metadata without dl_count
    const metadata = await fetch(`https://www.dlsite.com/maniax/api/=/product.json?locale=zh_CN&workno=${rjcode}`, {
        method: 'GET'
    })
    const metaJson = await metadata.json()

    // Fetch work's sales info
    const salesinfo = await fetch(`https://www.dlsite.com/maniax-touch/product/info/ajax?product_id=${rjcode}`, {
        method: 'GET'
    })
    const salesJson = await salesinfo.json()
    // console.log(salesJson[rjcode]);

    // Get dl_count [string type]
    work.dl_count = Number(salesJson[rjcode].dl_count)

    // Get rate_count
    work.rate_count = salesJson[rjcode].rate_count

    // Get rate_average_2dp
    work.rate_average_2dp = salesJson[rjcode].rate_average_2dp

    // Get rate_count_detail
    work.rate_count_detail = metaJson[0].rate_count_detail

    // Get work title
    work.work_name = metaJson[0].work_name

    // Insert work tags
    for (let i = 0; i < metaJson[0].genres.length; i++) {

        await db('t_tag_id')
        .insert({
            id: metaJson[0].genres[i].id,
            tag_name: metaJson[0].genres[i].name
        })
        .onConflict('id').ignore()
        .catch(err => {
            console.log(err);
        })

        await db('t_tag')
        .insert({
            tag_id: metaJson[0].genres[i].id,
            tag_rjcode: rjcode
        })
    }

    // // Insert work circle
    await db('t_circle')
    .returning('id')
    .insert({circle_name: metaJson[0].maker_name})
    .onConflict('circle_name')
    .ignore()

    let circleId = await db('t_circle')
    .select('id')
    .where({circle_name: metaJson[0].maker_name})

    work.circleId = circleId[0].id

    // // Get nsfw meta
    let nsfw;
    if (metaJson[0].age_category_string === 'adult') {
        nsfw = true;
    }
    else {
        nsfw = false;
    }
    work.nsfw = nsfw;

    // // Get work image
    work.imgName = await getImage(metaJson);

    // Get official_price
    work.official_price = metaJson[0].official_price

    // Get regist_date
    work.regist_date = metaJson[0].regist_date.slice(0, 10)
    
    // console.log(work);

    await db('ys')
    .insert({
        rj_code: work.rjcode,
        alt_rj_code: work.alt_rj_code, 
        work_title: work.work_name, 
        work_directory: work.work_directory,
        work_main_img: work.imgName,
        circle_id: work.circleId,
        nsfw: work.nsfw,
        official_price: work.official_price,
        regist_date: work.regist_date,
        dl_count: work.dl_count,
        rate_count: work.rate_count,
        rate_average_2dp: work.rate_average_2dp,
        rate_count_detail: work.rate_count_detail,
    })
    .onConflict('rj_code').ignore()
    .catch(err => {
        console.log(err);
    })

}

// TODO
// Need rate limit as well
// Make img directory dynamic

/**
 * 
 * @param {JSON} metaJson 
 * @returns imgName work's main image name
 */
async function getImage(metaJson) {

    const url = 'https:' + metaJson[0].image_main.url
    const imgName = path.parse(url).base
    const imgPath = './static/img/'

    // Check if the work's main img is already  existed
    if (fs.existsSync((imgPath + imgName))) {
        console.log(`${imgName} already exists`);
        return imgName
    }
    else {
        axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        })
        .then(async res => {
            res.data.pipe(fs.createWriteStream(imgPath + imgName));
            res.data.on('end', () => {
                console.log(`${imgName} download completed`);
            })
        })
        return imgName
    }
}

async function delAll() {
    await db('ys').del().truncate();
    await db('t_tag_id').del().truncate()
    await db('t_tag').del().truncate()
    await db('t_circle').del().truncate()
    return db('ys')
}