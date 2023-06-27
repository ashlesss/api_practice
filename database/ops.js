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

// Rate limiting the request 
const sleep = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

async function add() {
    // Test mode 
    // await delAll()

    const rootFolder = '/mnt/hgfs/test/RJ400000/'
    const folders = await fs.readdirSync(rootFolder);
    // console.log(rootFolder);
    // console.log(typeof fileList[0].slice(0, 8));
    let i = 0
    for ( const folder of folders ) {
        if (folder.match(/RJ\d{8}/)) {
            if (! (await isDuplicate(folder.slice(0, 10)))) {
                await db('ys')
                .insert({
                    rj_code: folder.slice(0, 10),
                    work_title: folder.slice(10), 
                    work_directory: (rootFolder + folder)})
                // .onConflict('rj_code').ignore()
                i++;
                await getWorkMetadata(folder.slice(0, 10))
                if ((i % 5) === 0) {
                    console.log("Cooldown 2 sec for every 5 requests");
                    await sleep(2000)
                }
            }
            else {
                continue
            }

            // // TEST
            // await db('ys')
            // .insert({rj_code: folder.slice(0, 10), work_title: folder.slice(10), work_directory: (rootFolder + folder)})
            // await getWorkMetadata(folder.slice(0, 10))
        }
        else if (folder.match(/RJ\d{6}/)) {
            if (!(await isDuplicate(folder.slice(0, 8)))) {
                await db('ys')
                .insert({
                    rj_code: folder.slice(0, 8), 
                    work_title: folder.slice(8), 
                    work_directory: (rootFolder + folder)})
                // .onConflict('rj_code').ignore()
                i++
                await getWorkMetadata(folder.slice(0, 8))
                if ((i % 5) === 0) {
                    console.log("Cooldown 2 sec for every 5 requests");
                    await sleep(2000)
                }
            }
            else {
                continue
            }

            // // TEST
            // await db('ys')
            // .insert({rj_code: folder.slice(0, 8), work_title: folder.slice(8), work_directory: (rootFolder + folder)})
            // await getWorkMetadata(folder.slice(0, 8))
        }
    }
    return await db('ys').count({count: 'rj_code'})
}

// TODO
// Need to change function name to reflect how this works
// May need to consider work don't have tags in Chinese
async function getWorkMetadata(rjcode) {
    // const rj = "RJ400984";
    const metadata = await fetch('https://www.dlsite.com/maniax/api/=/product.json?locale=zh_CN&workno=' + rjcode, {
        method: 'GET'
    })

    const metaJson = await metadata.json()

    for (let i = 0; i < metaJson[0].genres.length; i++) {
        // genres.push(metaJson[0].genres[i].name);
        // await db('t_tag').insert({tag : metaJson[0].genres[i].name, tag_rjcode : rjcode})
        await db('t_tag_id')
        .insert({tag_name: metaJson[0].genres[i].name})
        .onConflict('tag_name').ignore();

        let tagId = await db('t_tag_id')
        .select('id')
        .where({tag_name : metaJson[0].genres[i].name})

        // console.log(tagId);
        await db('t_tag').insert({tag_id: tagId[0].id, tag_rjcode: rjcode})
    }

    // Get work image
    await getImage(rjcode, metaJson)

}

// TODO
// Need rate limit as well
// Make img directory dynamic
async function getImage(rjcode, metaJson) {

    const url = 'https:' + metaJson[0].image_main.url

    // const url = 'https://img.dlsite.jp/modpub/images2/work/doujin/RJ344000/RJ343788_img_main.jpg'

    // console.log(path.parse(url).base);

    const imgName = path.parse(url).base

    const imgPath = './static/img/'
    // console.log(imgPath);

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
        await db('ys').where({rj_code: rjcode})
        .update({work_main_img: (imgName)})
    })
}

async function delAll() {
    // await db('ys').del().truncate();
    // await db('t_tag').del();
    await db('ys').del().truncate();
    await db('t_tag_id').del().truncate()
    await db('t_tag').del().truncate()
    return db('ys')
}

// helper 
// async function helper(rjcode) {
//     // const ysRec = await db('ys').where({rj_code : rjcode});

//     // const tagRec = await db('t_tag').select('tag').where({tag_rjcode: rjcode});

//     // if (ysRec.length === 0 && tagRec.length === 0) {
//     //     return {message: "workNotFound"};
//     // }
//     // else {
//     //     return {work: ysRec, tags: tagRec};
//     // }
//     return await db('t_tag_id')
//     .select('tag_name').join('t_tag', "t_tag_id.id", '=', "t_tag.tag_id")
//     .where({tag_rjcode: rjcode})
// }