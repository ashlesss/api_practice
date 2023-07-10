const knex = require('knex')
const config = require('../knexfile')
const db = knex(config.development)
const Config = require('../config.json')
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
    const record = await db('works_w_metadata')
    .select('*')
    .where({rj_code: rjcode})

    if (record.length === 0) {
        return {message: "workNotFound"};
    }
    else {
        // Parse stringified values
        record[0]['rate_count_detail'] = JSON.parse(record[0].rate_count_detail)
        record[0]['vas'] = JSON.parse(record[0].vas)
        record[0]['tags'] = JSON.parse(record[0].tags)
        return record[0]
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
        const worksPerPage = Config.worksPerPage;
        const totalWorks = await db('ys').count({count: 'rj_code'});
        const totalPage = Math.ceil(totalWorks[0].count / Number(worksPerPage));

        // First page
        if (page === '1') {
            const curWorks = await db('ys').orderBy('alt_rj_code', 'asc').limit(worksPerPage).offset(0)

            let works = [];

            // Push pagination info first
            works.push({
                current_page: Number(page),
                max_page: totalPage,
                total_works: totalWorks[0].count
            });

            // Then push work and tags 
            for (let i = 0; i < curWorks.length; i++) {
                works.push(await getFullRecord(curWorks[i].rj_code))
            }
            return works
        }
        // Other page than first page
        else if (Number(page) <= totalPage) {
            // console.log(worksPerPage * (Number(page) - 1));
            const curWorks = await db('ys')
            .orderBy('alt_rj_code', 'asc')
            .limit(worksPerPage)
            .offset((worksPerPage * (Number(page) - 1)))

            //when 3 works per page (2 * (Number(page) - 1) -1)

            let works = [];
            // Push pagination info first

            works.push({
                current_page: Number(page),
                max_page: totalPage,
                total_works: totalWorks[0].count
            });

            // Then push work and tags 
            for (let i = 0; i < curWorks.length; i++) {
                works.push(await getFullRecord(curWorks[i].rj_code))
            }
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