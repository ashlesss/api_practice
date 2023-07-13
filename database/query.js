const knex = require('knex')
const config = require('../knexfile')
const db = knex(config.development)
const Config = require('../config.json')
const e = require('express')

module.exports = {
    getFullRecord,
    getWorks,
    getWorkByKeyword,
}

/**
 * 
 * @param {string} rjcode RJcode 
 * @returns Formatted work record.
 */
async function getFullRecord(rjcode) {
    try { 
        const record = await db('works_w_metadata')
        .select('*')
        .where({rj_code: rjcode})

        if (record.length === 0) {
            return {message: "workNotFound"};
        }
        else {
            // Parse stringified values
            delete record[0].circleObj
            record[0]['rate_count_detail'] = JSON.parse(record[0].rate_count_detail)
            record[0]['vas'] = JSON.parse(record[0].vas)
            record[0]['tags'] = JSON.parse(record[0].tags)
            return record[0]
        }
    } catch(err) {
        return {
            error: err,
            message: err.message
        }
    }
}

/**
 * This method will return works with their metadata from the database.
 * @param {number} page Page number  
 * @param {string} order By RJ code, created date, rate_average_2dp, etc.
 * @param {string} sort By ascending or descending order.
 * @returns Object with pagination and works.
 */
async function getWorks(page, order, sort) {
    // console.log(page); // String
    const worksPerPage = Config.worksPerPage;
    const totalWorks = await db('ys').count({count: 'rj_code'});
    const totalPage = Math.ceil(totalWorks[0].count / Number(worksPerPage));

    // First page
    if (page === '1') {
        const curWorks = await db('ys')
        .orderBy(order, sort)
        .limit(worksPerPage)
        .offset(0)

        let works = [];

        // Get pagination info first
        const pagination = {
            current_page: Number(page),
            max_page: totalPage,
            total_works: totalWorks[0].count,
        }

        // Then get works and tags 
        for (let i = 0; i < curWorks.length; i++) {
            works.push(await getFullRecord(curWorks[i].rj_code))
        }
        return {pagination: pagination, works: works}
    }
    // Other page than first page
    else if (Number(page) <= totalPage) {
        // console.log(worksPerPage * (Number(page) - 1));
        const curWorks = await db('ys')
        .orderBy(order, sort)
        .limit(worksPerPage)
        .offset((page - 1) * worksPerPage)

        //when 3 works per page (2 * (Number(page) - 1) -1)

        let works = [];

        // Get pagination info first
        const pagination = {
            current_page: Number(page),
            max_page: totalPage,
            total_works: totalWorks[0].count,
        }

        // Then get works and tags 
        for (let i = 0; i < curWorks.length; i++) {
            works.push(await getFullRecord(curWorks[i].rj_code))
        }
        return {pagination: pagination, works: works}
    }
    else {
        return {message: "no more page"}
    }
}

/**
 * This method will handle keyword search and return works sorted by keywords.
 * @param {string} keyword Searching keyword by va, tag, circle.
 * @param {string} order ['alt_rj_code', 'regist_date', 'dl_count', 'rate_count', 'official_price', 'nsfw']
 * @param {string} sort By ascending or descending order.
 * @returns Work results if success. Throw error when fail.
 */
async function getWorkByKeyword(keyword, order, sort) {
    // If the keyword is a RJ code
    const rjcode = keyword.match(/RJ\d*/i)
    if (rjcode) {
        if (rjcode[0].length === 10) {
            return await db('works_w_metadata')
            .select('*')
            .where({rj_code: rjcode[0]})
        }
        else if (rjcode[0].length === 8) {
            return await db('works_w_metadata')
            .select('*')
            .where({rj_code: rjcode[0]})
        }
        else {
            // console.log(`invalid rjcode`);
            let e = new Error(`${rjcode} Invalid RJ code.`)
            e.name = "Invalid_length"
            throw e
        }
    }
    
    // If the keyword is circle
    const circle = keyword.match(/circle:.+?(?=\$)/) || []
    let cleanCircle = []
    let circleQueryId = []
    if (circle.length !== 0) {
        cleanCircle = circle[0].slice(7)
        circleQueryId = await db('t_circle')
        .where('circle_name', 'like', `%${cleanCircle}%`)
        .select('id')
        .pluck('id')
    }

    const va = keyword.match(/va:.+?(?=\$)/g) || []
    // console.log(va);
    let cleanVA = []
    let vaQueryId = []
    if (va.length !== 0 ) {
        for (let a = 0; a < va.length; a++) {
            cleanVA.push(va[a].match(/[^va:].+/)[0])
        }
        // console.log(cleanVA);
        vaQueryId = await db('t_va_id')
        .whereIn('va_name', cleanVA)
        .select('id')
        .pluck('id')
    }
    else if (va.length == 1) {
        cleanVA = va.match(/[^va:].+/)[0]
        // console.log(cleanVA);
        vaQueryId = await db('t_va_id')
        .whereIn('va_name', cleanVA)
        .select('id')
        .pluck('id')
    }
    // console.log(vaQueryId);
    
    const tag = keyword.match(/tag:.+?(?=\$)/g) || []
    let cleanTag = []
    let tagQueryId = []
    if (tag.length !== 0) {
        for (let i = 0; i < tag.length; i++) {
            cleanTag.push(tag[i].match(/[^tag:].+/)[0])
        }
        // console.log(cleanTag);
        tagQueryId = await db('t_tag_id')
        .whereIn('tag_name', cleanTag)
        .select('id')
        .pluck('id')
    }
    else if (tag.length === 1) {
        cleanTag = tag[0].match(/[^tag:].+/)[0]
        // console.log(cleanTag);
        tagQueryId = await db('t_tag_id')
        .whereIn('tag_name', cleanTag)
        .select('id')
        .pluck('id')
    }
    // console.log(tagQueryId);

    if (cleanCircle.length !== 0 && cleanTag.length !== 0 && cleanVA.length !== 0) {
        const result = db.raw(
            `SELECT *
            FROM works_w_metadata as works
            INNER JOIN t_circle ON t_circle.id = works.circle_id
            INNER JOIN t_tag ON t_tag.tag_rjcode = works.rj_code
            INNER JOIN t_va On t_va.va_rjcode = works.rj_code
            WHERE
            circle_id = (SELECT id FROM t_circle WHERE t_circle.id IN (${circleQueryId}))
            AND
            tag_id = (SELECT tag_id FROM t_tag WHERE t_tag.tag_id IN (${tagQueryId}))
            AND
            va_id = (SELECT va_id FROM t_va WHERE t_va.va_id IN (${vaQueryId}))
            GROUP BY rj_code
            ORDER BY ${order} ${sort}`
        )
        return result
    }
    else if (cleanCircle.length !== 0 && cleanTag.length == 0 && cleanVA.length == 0) {
        const result = db('works_w_metadata')
        .select('*')
        .whereIn('circle_id', circleQueryId)
        return result
    }
    else if (cleanCircle.length !== 0 && cleanTag.length !== 0 && cleanVA.length == 0) {
        const result = db.raw(
            `SELECT *
            FROM works_w_metadata as works
            INNER JOIN t_circle ON t_circle.id = works.circle_id
            INNER JOIN t_tag ON t_tag.tag_rjcode = works.rj_code
            WHERE
            circle_id = (SELECT id FROM t_circle WHERE t_circle.id IN (${circleQueryId}))
            AND
            tag_id = (SELECT tag_id FROM t_tag WHERE t_tag.tag_id IN (${tagQueryId}))
            GROUP BY rj_code
            ORDER BY ${order} ${sort}`
        )
        return result
    }
    else if (cleanCircle.length !== 0 && cleanTag.length === 0 && cleanVA.length !== 0) {
        const result = db.raw(
            `SELECT *
            FROM works_w_metadata as works
            INNER JOIN t_circle ON t_circle.id = works.circle_id
            INNER JOIN t_va On t_va.va_rjcode = works.rj_code
            WHERE
            circle_id = (SELECT id FROM t_circle WHERE t_circle.id IN (${circleQueryId}))
            AND
            va_id = (SELECT va_id FROM t_va WHERE t_va.va_id IN (${vaQueryId}))
            GROUP BY rj_code
            ORDER BY ${order} ${sort}`
        )
        return result
    }
    else if (cleanCircle.length === 0 && cleanTag.length !== 0 && cleanVA.length !== 0) {
        const result = db.raw(
            `SELECT *
            FROM works_w_metadata as works
            INNER JOIN t_tag ON t_tag.tag_rjcode = works.rj_code
            INNER JOIN t_va On t_va.va_rjcode = works.rj_code
            WHERE
            tag_id = (SELECT tag_id FROM t_tag WHERE t_tag.tag_id IN (${tagQueryId}))
            AND
            va_id = (SELECT va_id FROM t_va WHERE t_va.va_id IN (${vaQueryId}))
            GROUP BY rj_code
            ORDER BY ${order} ${sort}`
        )
        return result
    }
    else if (cleanCircle.length === 0 && cleanTag.length === 0 && cleanVA.length !== 0) {
        const result = db.raw(
            `SELECT *
            FROM works_w_metadata as works
            INNER JOIN t_va On t_va.va_rjcode = works.rj_code
            WHERE
            va_id = (SELECT va_id FROM t_va WHERE t_va.va_id IN (${vaQueryId}))
            GROUP BY rj_code
            ORDER BY ${order} ${sort}`
        )
        return result
    }
    else if (cleanCircle.length === 0 && cleanTag.length !== 0 && cleanVA.length === 0) {
        const result = db.raw(
            `SELECT *
            FROM works_w_metadata as works
            INNER JOIN t_tag ON t_tag.tag_rjcode = works.rj_code
            WHERE
            tag_id = (SELECT tag_id FROM t_tag WHERE t_tag.tag_id IN (${tagQueryId}))
            GROUP BY rj_code
            ORDER BY ${order} ${sort}`
        )
        return result
    }
    else {
        throw new Error(`Failed to query database. Check your input or rescan works.`)
    }

}