//cSpell:disable
const knex = require('knex')
const config = require('../knexfile')
const db = knex(config.development)
const fs = require("fs-extra")
const axios = require('axios')
const path = require('node:path');
const { isDuplicate } = require('./query')
const { insertMeatadata } = require('./metadata')

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
    // const rootFolder = '/mnt/hgfs/test/RJ400000/'
    // const rootFolder = '/mnt/hgfs/test/2/'
    const rootFolder = '/mnt/hgfs/RJ300000/'
    const folders = fs.readdirSync(rootFolder);
    let i = 0
    for ( const folder of folders ) {
        if (folder.match(/RJ\d{8}/)) {
            let gb_rjcode = folder.match(/RJ\d{8}/)[0]
            if (! (await isDuplicate(gb_rjcode))) {
                const work = {
                    rjcode: gb_rjcode,
                    alt_rj_code: Number(gb_rjcode.slice(2, 10)), 
                    work_name: "",
                    work_directory: (rootFolder + folder),
                }

                i++;

                await getMetadata(work.rjcode)
                .then(async metajson => {

                    // filter out invalid RJ code
                    if (metajson.length !== 0) {
                        await getSalesdata(work.rjcode)
                        .then(async salesjson => {
                            let imgName = await getImage(metajson)
                            // console.log(imgName);
                            await insertMeatadata(metajson, salesjson, work.work_directory, imgName)
                        })
                    }
                })
                .catch(err => {
                    console.log(`getMetadata failed: ${err}`);
                })
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
            // // for RJ123456
            // console.log(folder.match(/RJ\d{6}/)[0]);
            let gb_rjcode = folder.match(/RJ\d{6}/)[0]
            if (!(await isDuplicate(gb_rjcode))) {
                const work = {
                    rjcode: gb_rjcode,
                    alt_rj_code: Number(gb_rjcode.slice(2, 8)), 
                    work_name: "",
                    work_directory: (rootFolder + folder),
                }

                i++
                // await getWorkMetadata(work.rjcode, work, i)
                // .catch(err => {
                //     console.log(err);
                // })
                await getMetadata(work.rjcode)
                .then(async metajson => {

                    // filter out invalid RJ code
                    if (metajson.length !== 0) {
                        await getSalesdata(work.rjcode)
                        .then(async salesjson => {
                            let imgName = await getImage(metajson)
                            // console.log(imgName);
                            await insertMeatadata(metajson, salesjson, work.work_directory, imgName)
                        })
                    }
                })
                .catch(err => {
                    console.log(`getMetadata failed: ${err}`);
                })

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

async function getSalesdata(rjcode) {

    try {
        const salesinfo = await fetch(`https://www.dlsite.com/maniax-touch/product/info/ajax?product_id=${rjcode}`, {
            method: 'GET'
        })
        return await salesinfo.json()
    } catch(e) {
        console.log(`getSalesdata failed: ${e}`);
    }
}

async function getMetadata(rjcode) {
    try {
        const metadata = await fetch(`https://www.dlsite.com/maniax/api/=/product.json?locale=zh_CN&workno=${rjcode}`, {
            method:'GET'
        })

        return await metadata.json()
    } catch(e) {
        console.log(`getMetadata failed: ${e}`);
    }
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
        .catch(err => {
            // console.log(errImage);
            console.log(`getImage failed ${err} ON work ${metaJson[0].workno}`);
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