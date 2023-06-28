const knex = require('knex')
const config = require('../knexfile')
const db = knex(config.development)
// const fs = require("fs-extra")
// const axios = require('axios')
// const path = require('node:path');

module.exports = {
    isDuplicate,
    getFullRecord,
    getWorks,
    getWorkInfo,
    getWorkTag,
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
            const curWorks = await db('ys').orderBy('alt_rj_code', 'asc').limit(worksPerPage).offset(0)

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
            .orderBy('alt_rj_code', 'asc')
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