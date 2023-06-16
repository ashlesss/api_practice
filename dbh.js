const knex = require('knex')
const config = require('./knexfile')
const db = knex(config.development)
const fs = require("fs-extra")
module.exports = {
    add,
    delAll,
    getRecord,
    getWorkInfo,
    getWorkMetadata,
    getWorkTag,
    getFullRecord,
    // isDuplicate
}

async function add() {
    const rootFolder = '/mnt/hgfs/test/RJ400000/'
    const folders = await fs.readdirSync(rootFolder);
    // console.log(rootFolder);
    // console.log(typeof fileList[0].slice(0, 8));
    for ( const folder of folders ) {
        if (folder.match(/RJ\d{8}/)) {
            if (! (await isDuplicate(folder.slice(0, 10)))) {
                await db('ys')
                .insert({rj_code: folder.slice(0, 10), work_title: folder.slice(10), work_directory: (rootFolder + folder)})
                // .onConflict('rj_code').ignore()
                await getWorkMetadata(folder.slice(0, 10))
            }
            else {
                continue
            }
        }
        else if (folder.match(/RJ\d{6}/)) {
            if (!(await isDuplicate(folder.slice(0, 8)))) {
                await db('ys')
                .insert({rj_code: folder.slice(0, 8), work_title: folder.slice(8), work_directory: (rootFolder + folder)})
                // .onConflict('rj_code').ignore()
                await getWorkMetadata(folder.slice(0, 8))
            }
            else {
                continue
            }
        }
    }
    return db('t_tag')
}



async function delAll() {
    await db('ys').del().truncate();
    await db('t_tag').del();
    return db('ys')
}

async function getRecord() {
    return db('ys');
}

function getWorkInfo(rjcode) {
    return db('ys').where({ rj_code : rjcode}).first();
}

async function getWorkTag(rjcode) {
    return await db('t_tag').select('tag').where({tag_rjcode : rjcode})
}


// May need to add rate limit in order to keep from blocking.
async function getWorkMetadata(rjcode) {
    // const rj = "RJ400984";
    const metadata = await fetch('https://www.dlsite.com/maniax/api/=/product.json?locale=zh_CN&workno=' + rjcode, {
        method: 'GET'
    })

    const metaJson = await metadata.json()
    // console.log(metaJson[0].genres.length);
    // let genres = [];
    // console.log(metaJson);
    for (let i = 0; i < metaJson[0].genres.length; i++) {
        // genres.push(metaJson[0].genres[i].name);
        await db('t_tag').insert({tag : metaJson[0].genres[i].name, tag_rjcode : rjcode})
    }
    // return JSON.stringify(genres);
    // return genres
    // return metaJson[0].genres[index].name;
}

async function isDuplicate(rjcode) {
    const status = await fetch('http://localhost:4000/api/find/' + rjcode, {
        method: 'GET'
    })

    const statusjson = await status.json();
    // console.log(statusjson.message);
    if(statusjson.message === 'found') {
        return true;
    }
    else {
        return false;
    }
}

async function getFullRecord(rjcode) {
    const ysRec = await db('ys').where({rj_code : rjcode});

    const tagRec = await db('t_tag').select('tag').where({tag_rjcode: rjcode});

    if (ysRec.length === 0 && tagRec.length === 0) {
        return {message: "workRecordNotFound"};
    }
    else {
        return {work: ysRec, tags: tagRec};
    }

}