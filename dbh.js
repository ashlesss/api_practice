const knex = require('knex')
const config = require('./knexfile')
const db = knex(config.development)
const fs = require("fs-extra")
module.exports = {
    add,
    delAll,
    getRecord,
}

async function add() {
    const rootFolder = '/mnt/e/test/RJ400000/'
    const folders = await fs.readdirSync(rootFolder);
    // console.log(rootFolder);
    // console.log(typeof fileList[0].slice(0, 8));
    for ( const folder of folders ) {
        if (folder.match(/RJ\d{8}/)) {
            await db('ys')
            .insert({rj_code: folder.slice(0, 10), work_title: folder.slice(10), work_directory: (rootFolder + folder)})
            .onConflict('rj_code').ignore()
            
        }
        else if (folder.match(/RJ\d{6}/)) {
            await db('ys')
            .insert({rj_code: folder.slice(0, 8), work_title: folder.slice(8), work_directory: (rootFolder + folder)})
            .onConflict('rj_code').ignore()
        }
    }
    return db('ys');
    // const [id] = await db('ys').insert(body);
    // return id;
}

async function delAll() {
    await db('ys').del().truncate();
    return db('ys')
}

async function getRecord() {
    return db('ys');
}