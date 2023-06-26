const knex = require('knex')
const config = require('./knexfile')
const db = knex(config.development)
const fs = require("fs-extra")
const axios = require('axios')
const path = require('node:path'); 
const { stringify } = require('node:querystring')

module.exports = {
    add,
    delAll,
    getWorks,
    getWorkInfo,
    getWorkMetadata,
    getWorkTag,
    getFullRecord,
    getImage,
    // helper,
    // isDuplicate
}


// TODO 
// Make rootFolder a dynamic value
// Only read rjcode from the folder name 
// Get work's name from API and write it to database
async function add() {
    // Test mode 
    // await delAll()

    const rootFolder = '/mnt/hgfs/test/RJ400000/'
    const folders = await fs.readdirSync(rootFolder);
    // console.log(rootFolder);
    // console.log(typeof fileList[0].slice(0, 8));
    for ( const folder of folders ) {
        if (folder.match(/RJ\d{8}/)) {
            if (! (await isDuplicate(folder.slice(0, 10)))) {
                await db('ys')
                .insert({
                    rj_code: folder.slice(0, 10),
                    work_title: folder.slice(10), 
                    work_directory: (rootFolder + folder)})
                // .onConflict('rj_code').ignore()
                await getWorkMetadata(folder.slice(0, 10))
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
                await getWorkMetadata(folder.slice(0, 8))
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

// TODO
// May need to add rate limit in order to keep from blocking.
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

async function isDuplicate(rjcode) {
    const status = await fetch('http://localhost:4000/api/query/find/' + rjcode, {
        method: 'GET'
    })

    const statusjson = await status.json();
    // console.log(statusjson.message);
    if(statusjson.message === 'workNotFound') {
        return false;
    }
    else {
        return true;
    }
}

async function getFullRecord(rjcode) {
    const ysRec = await db('ys').where({rj_code : rjcode});

    const tagRec = await db('t_tag_id')
    .select('tag_name')
    .join('t_tag', "t_tag_id.id", "=", "t_tag.tag_id")
    .where({tag_rjcode: rjcode})

    // const tagRec = await db('t_tag').select('tag').where({tag_rjcode: rjcode});

    if (ysRec.length === 0 && tagRec.length === 0) {
        return {message: "workNotFound"};
    }
    else {
        return {work: ysRec, tags: tagRec};
    }

}

async function delAll() {
    // await db('ys').del().truncate();
    // await db('t_tag').del();
    await db('ys').del().truncate();
    await db('t_tag_id').del().truncate()
    await db('t_tag').del().truncate()
    return db('ys')
}

// This function now return all the works with tags from the database
// Limit works per page = 12
// TODO 
// Make works per page as a dynamic value 
async function getWorks(page, isAll) {

    if (isAll && isAll == 'yes') {
        const allworks = await db('ys').select('rj_code')

        let fullRecord = [];

        for (let i = 0; i < allworks.length; i++) {
            fullRecord.push(await getFullRecord(allworks[i].rj_code))
        }
        fullRecord.push(await db('ys').count({count: 'rj_code'}))
        return fullRecord
    }
    else {
        // console.log(page); // String
        const worksPerPage = 12;
        const totalWorks = await db('ys').count({count: 'rj_code'});
        const totalPage = Math.ceil(totalWorks[0].count / Number(worksPerPage));
        if (page === '1') {
            const curWorks = await db('ys').orderBy('id').limit(worksPerPage).offset(0)

            let works = [];

            for (let i = 0; i < curWorks.length; i++) {
                works.push(await getFullRecord(curWorks[i].rj_code))
            }
            works.push({max_page: totalPage})
            works.push({current_page: Number(page)})
            return works
        }
        else if (Number(page) <= totalPage) {
            // console.log(worksPerPage * (Number(page) - 1));
            const curWorks = await db('ys')
            .orderBy('id')
            .limit(worksPerPage)
            .offset((worksPerPage * (Number(page) - 1)))

            //when 3 works per page (2 * (Number(page) - 1) -1)

            let works = [];

            for (let i = 0; i < curWorks.length; i++) {
                works.push(await getFullRecord(curWorks[i].rj_code))
            }
            works.push({max_page: totalPage})
            works.push({current_page: Number(page)})
            return works
        }
        else {
            return {message: "no more page"}
        }
    }
}

// This function will return single record from given rjcode
async function getWorkInfo(rjcode) {
    return await getFullRecord(rjcode)
    // return db('ys').where({ rj_code : rjcode}).first();
}

// Test function?
async function getWorkTag(rjcode) {
    return await db('t_tag').select('tag').where({tag_rjcode : rjcode})
}