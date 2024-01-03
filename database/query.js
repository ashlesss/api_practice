const { db } = require('./metadata')
const { config } = require('../config')

module.exports = {
    getFullRecord,
    getWorks,
    getWorkByKeyword,
}

/**
 * 
 * @param {object} work Work object
 * @returns Formatted work record.
 */
function getFullRecord(work) {
    delete work.circleObj
    work['rate_count_detail'] = JSON.parse(work.rate_count_detail)
    work['vas'] = JSON.parse(work.vas)
    work['tags'] = JSON.parse(work.tags)
    return work
}

/**
 * This method will return works with their metadata from the database.
 * @param {number} page Page number  
 * @param {string} order By RJ code, created date, rate_average_2dp, etc.
 * @param {string} sort By ascending or descending order.
 * @param {number} subtitle 1 means sort works by have subtitle, 0 means sort by subtitle is off.
 * @returns Object with pagination and works.
 */
async function getWorks(page, order, sort, subtitle) {
    const worksPerPage = config.worksPerPage;
    const sortSub = sortBySubtitle(subtitle, 0)
    const orderQuery = randomOrder(order)

    const curWorks = await db.raw(
        `SELECT *
        FROM works_w_metadata_public
        ${sortSub}
        ORDER BY ${orderQuery} ${sort}
        LIMIT ${worksPerPage}
        OFFSET ${(page - 1) * worksPerPage}`
    )
    
    const totalWorks = sortSub ? await db('works_w_metadata_public').where({has_subtitle: 1}).count({count: 'rj_code'}) 
        : await db('works_w_metadata_public').count({count: 'rj_code'})
    const totalPage = Math.ceil(totalWorks[0].count / Number(worksPerPage));

    let works = [];

    // Get pagination info first
    const pagination = {
        current_page: page,
        max_page: totalPage,
        total_works: totalWorks[0].count,
    }

    // console.log(curWorks);

    if (curWorks.length !== 0) {
        for (let i = 0; i < curWorks.length; i++) {
            works.push(getFullRecord(curWorks[i]))
        }
    }

    return {pagination: pagination, works: works}
}

// async function getWorkByKeyword(keyword, order, sort, subtitle) {
//     // Extract tag/circle/va id from keyword
//     let parsedKeyword = parseKeywords(keyword)

// }

// console.log(parseKeywords('$va:Sweet love$ $va:柚木つばめ$ something sp2'));

// function parseKeywords(keywords) {
//     const regex = /^(\$[^$]+:[^$]+\$)|\s(\$[^$]+:[^$]+\$)/g
//     let matched = keywords.match(regex)
//     matched = matched.map(kw => kw.trim())

//     const plainKeywords = matched.reduce((acc, curr) => {
//         return acc.replace(curr, '')
//     }, keywords)

//     return {
//         accurateSearchTerms: splitKeywords(matched),
//         plainKeywords: plainKeywords.trim().split(" ")
//     }
// }

// function splitKeywords(keywords) {
//     return keywords.map(kw => {
//         let colonIndex = kw.indexOf(':')
//         // return {
//         //     term: kw.slice(1, colonIndex),
//         //     keyword: kw.slice(colonIndex + 1, -1)
//         // }
//         return kw.slice(colonIndex + 1, -1)
//     })
// }

/**
 * This method will handle keyword search and return works sorted by keywords.
 * @param {string} keyword Searching keyword by va, tag, circle.
 * @param {string} order ['alt_rj_code', 'regist_date', 'dl_count', 'rate_count', 'official_price', 'nsfw', 'random']
 * @param {string} sort By ascending or descending order.
 * @returns Work results if success. Throw error when fail.
 */
async function getWorkByKeyword(keyword, order, sort, subtitle) {
    const sortSub = sortBySubtitle(subtitle, 1)
    const orderQuery = randomOrder(order)
    // If the keyword is a RJ code
    const rjcode = keyword.match(/RJ\d*/i)
    if (rjcode) {
        if (rjcode[0].length === 10) {
            return await db.raw(
                `SELECT *
                FROM works_w_metadata_public
                WHERE rj_code = '${rjcode[0]}'
                ${sortSub}`
            )
        }
        else if (rjcode[0].length === 8) {
            return await db.raw(
                `SELECT *
                FROM works_w_metadata_public
                WHERE rj_code = '${rjcode[0]}'
                ${sortSub}`
            )
        }
        else {
            // console.log(`invalid rjcode`);
            let e = new Error(`${rjcode} Invalid RJ code.`)
            e.name = "Invalid_length"
            throw e
        }
    }

    const altRJcode = keyword.match(/\b(\d{6}|\d{8})\b/)
    if (altRJcode) {
        return db.raw(
            `SELECT *
            FROM works_w_metadata_public
            WHERE alt_rj_code = '${altRJcode[0]}'
            ${sortSub}`
        )
    }
    
    // If the keyword contains circle
    // const circle = keyword.match(/circle:.+?(?=\$)/g) || []
    let cleanCircle = []
    const matchCircle = [...keyword.matchAll(/\$(circle):([^\$\s]+)\$/g)]
    matchCircle.forEach(match => {
        cleanCircle.push(`${match[2]}`)
    })
    let circleQueryId = []
    if (cleanCircle.length !== 0) {
        // for (let i = 0; i < circle.length; i++) {
        //     cleanCircle.push(circle[i].match(/[^circle:].+/)[0])
        // }

        circleQueryId = await db('t_circle')
        .whereIn('circle_name', cleanCircle)
        .select('id')
        .pluck('id')
    }
    // else if (circle.length === 1) {
    //     cleanCircle = circle.match(/[^circle:].+/)[0]
    //     circleQueryId = await db('t_circle')
    //     .whereIn('circle_name', cleanCircle)
    //     .select('id')
    //     .pluck('id')
    // }

    // If keyword contains va.
    // const va = keyword.match(/va:.+?(?=\$)/g) || []
    // console.log(va);
    let cleanVA = []
    const matchVA = [...keyword.matchAll(/\$(va):([^\$\s]+)\$/g)] 
    matchVA.forEach(match => {
        cleanVA.push(`${match[2]}`)
    })
    let vaQueryId = []
    if (cleanVA.length !== 0 ) {
        // for (let a = 0; a < va.length; a++) {
        //     cleanVA.push(va[a].match(/[^va:].+/)[0])
        // }
        // console.log(cleanVA);s
        vaQueryId = await db('t_va_id')
        .whereIn('va_name', cleanVA)
        .select('id')
        .pluck('id')
    }
    // else if (va.length === 1) {
    //     cleanVA = va.match(/[^va:].+/)[0]
    //     // console.log(cleanVA);
    //     vaQueryId = await db('t_va_id')
    //     .whereIn('va_name', cleanVA)
    //     .select('id')
    //     .pluck('id')
    // }
    // console.log(vaQueryId);
    
    // If keyword contains tag.
    // const tag = keyword.match(/tag:.+?(?=\$)/g) || []
    let cleanTag = []
    const matchTag = [...keyword.matchAll(/\$(tag):([^\$\s]+)\$/g)]
    matchTag.forEach(match => {
        cleanTag.push(`${match[2]}`)
    })
    let tagQueryId = []
    if (cleanTag.length !== 0) {
        // for (let i = 0; i < tag.length; i++) {
        //     cleanTag.push(tag[i].match(/[^tag:].+/)[0])
        // }
        // console.log(cleanTag);
        tagQueryId = await db('t_tag_id')
        .whereIn('tag_name', cleanTag)
        .select('id')
        .pluck('id')
    }
    // else if (tag.length === 1) {
    //     cleanTag = tag[0].match(/[^tag:].+/)[0]
    //     // console.log(cleanTag);
    //     tagQueryId = await db('t_tag_id')
    //     .whereIn('tag_name', cleanTag)
    //     .select('id')
    //     .pluck('id')
    // }
    // console.log(tagQueryId);

    // Main search block.
    if (cleanCircle.length !== 0 && cleanTag.length !== 0 && cleanVA.length !== 0) {
        const queryRSP = sortByRSP(keyword)
        // console.log(queryRSP);
        const result = db.raw(
            `SELECT 
            rj_code, alt_rj_code, work_title, work_main_img, circle_id, 
            circle_name, circleObj, nsfw, official_price, dl_count, regist_date,
            rate_count, rate_average_2dp, rate_count_detail, vas, tags
            FROM (
            SELECT *
            FROM
            (
            SELECT *
            FROM t_tag 
            WHERE t_tag.tag_rjcode IN
            (SELECT va_rjcode
            FROM t_va
            WHERE t_va.va_id IN (${vaQueryId})
            GROUP BY va_rjcode
            HAVING Count(va_rjcode)=${vaQueryId.length})
            )
            INNER JOIN works_w_metadata_public ON works_w_metadata_public.rj_code = tag_rjcode
            WHERE tag_id IN (${tagQueryId})
            GROUP BY tag_rjcode
            HAVING Count(tag_rjcode)=${tagQueryId.length}
            )
            WHERE circle_id IN (${circleQueryId})
            ${queryRSP}
            ${sortSub}
            GROUP BY rj_code
            HAVING Count(rj_code)=${circleQueryId.length}
            ORDER BY ${orderQuery} ${sort}`
        )
        return result
    }
    else if (cleanCircle.length !== 0 && cleanTag.length == 0 && cleanVA.length == 0) {
        const queryRSP = sortByRSP(keyword)
        const result = db.raw(
            `SELECT *
            FROM works_w_metadata_public AS works
            WHERE works.circle_id IN (${circleQueryId})
            ${queryRSP}
            ${sortSub}
            GROUP BY rj_code
            HAVING Count(rj_code)=${circleQueryId.length}
            ORDER BY ${orderQuery} ${sort}`
        )
        return result
    }
    else if (cleanCircle.length !== 0 && cleanTag.length !== 0 && cleanVA.length == 0) {
        const queryRSP = sortByRSP(keyword)
        const result = db.raw(
            `SELECT *
            FROM 
            (
            SELECT *
             FROM works_w_metadata_public AS works
            WHERE works.rj_code IN (
            SELECT tag_rjcode
            FROM t_tag
            WHERE t_tag.tag_id IN (${tagQueryId}) 
            GROUP BY tag_rjcode
            HAVING Count(tag_rjcode) = ${tagQueryId.length})
            )
            WHERE circle_id IN (${circleQueryId}) 
            ${queryRSP}
            ${sortSub}
            GROUP BY rj_code
            HAVING Count(rj_code) = ${circleQueryId.length};
            ORDER BY ${orderQuery} ${sort}`
        )
        return result
    }
    else if (cleanCircle.length !== 0 && cleanTag.length === 0 && cleanVA.length !== 0) {
        const queryRSP = sortByRSP(keyword)
        const result = db.raw(
            `SELECT * 
            FROM 
            ( 
            SELECT *
            FROM works_w_metadata_public AS works
            WHERE works.rj_code IN
            (SELECT va_rjcode
            FROM t_va
            WHERE t_va.va_id IN (${vaQueryId})
            GROUP BY va_rjcode
            HAVING Count(va_rjcode)=${vaQueryId.length})
            )
            WHERE circle_id IN (${circleQueryId})
            ${queryRSP}
            ${sortSub}
            GROUP BY rj_code 
            HAVING Count(rj_code)=${circleQueryId.length}
            ORDER BY ${orderQuery} ${sort}`
        )
        return result
    }
    else if (cleanCircle.length === 0 && cleanTag.length !== 0 && cleanVA.length !== 0) {
        const queryRSP = sortByRSP(keyword)
        const result = db.raw(
            `SELECT *
            FROM works_w_metadata_public
            WHERE rj_code IN 
            (
            SELECT tag_rjcode
            FROM
            (
            SELECT *
            FROM t_tag 
            WHERE t_tag.tag_rjcode IN
            (SELECT va_rjcode
            FROM t_va
            WHERE t_va.va_id IN (${vaQueryId})
            GROUP BY va_rjcode
            HAVING Count(va_rjcode)=${vaQueryId.length})
            )
            WHERE tag_id IN (${tagQueryId})
            ${queryRSP}
            ${sortSub}
            GROUP BY tag_rjcode
            HAVING Count(tag_rjcode)=${tagQueryId.length}
            )
            ORDER BY ${orderQuery} ${sort}`
        )
        return result
    }
    else if (cleanCircle.length === 0 && cleanTag.length === 0 && cleanVA.length !== 0) {
        const queryRSP = sortByRSP(keyword)
        const result = db.raw(
            `SELECT *
            FROM works_w_metadata_public
            WHERE rj_code IN 
            (SELECT va_rjcode
            FROM t_va
            WHERE t_va.va_id IN (${vaQueryId})
            ${queryRSP}
            ${sortSub}
            GROUP BY va_rjcode
            HAVING Count(va_rjcode)=${vaQueryId.length})
            ORDER BY ${orderQuery} ${sort}`
        )
        return result
    }
    else if (cleanCircle.length === 0 && cleanTag.length !== 0 && cleanVA.length === 0) {
        const queryRSP = sortByRSP(keyword)
        const result = db.raw(
            `SELECT *
            FROM works_w_metadata_public
            WHERE rj_code IN 
            (SELECT tag_rjcode
            FROM t_tag
            WHERE t_tag.tag_id IN (${tagQueryId})
            ${queryRSP}
            ${sortSub}
            GROUP BY tag_rjcode
            HAVING Count(tag_rjcode)=${tagQueryId.length})
            ORDER BY ${orderQuery} ${sort}`
        )
        return result
    }
    // else {
    //     throw new Error(`Failed to query database. Check your input or rescan works.`)
    // }

    // If no circle, vas, and tags in keywords, search rate, sell, and price only.
    const queryRSP = sortByRSP(keyword)
    if (queryRSP) {
        return await db.raw(
            `SELECT * 
            FROM works_w_metadata_public
            WHERE ${queryRSP.slice(5)}
            ${sortSub}
            ORDER BY ${orderQuery} ${sort}`
        )
    }
    
}

/**
 * Return a sorting command for database to sort works by rate, sell, or/and price.
 * @param {string} keyword Keyword from user's search keyword.
 * @returns A string contains sorting raw commands for database.
 */
function sortByRSP(keyword) {
    const rate = [...keyword.matchAll(/\$(rate):([^\$\s]+)\$/g)]
    const sell = [...keyword.matchAll(/\$(sell):([^\$\s]+)\$/g)]
    const price = [...keyword.matchAll(/\$(price):([^\$\s]+)\$/g)]
    let whereCondition = ''

    rate.forEach(match => {
        whereCondition = whereCondition + ` AND rate_average_2dp >= ${match[2]}`
    })
    sell.forEach(match => {
        whereCondition = whereCondition + ` AND dl_count >= ${match[2]}`
    })
    price.forEach(match => {
        whereCondition = whereCondition + ` AND official_price >= ${match[2]}`
    })
    return whereCondition
}

/**
 * 
 * @param {number} subtitle Sorting by has subtitle switch. 1 means on, 0 means off.
 * @param {number} needAND A switch that controls query command format.
 * @returns Query command
 */
function sortBySubtitle(subtitle, needAND) {
    if (needAND === 1) {
        if (subtitle === 1) {
            return `AND has_subtitle = 1`
        }
        else {
            return ''
        }
    }
    else {
        if (subtitle === 1) {
            return `WHERE has_subtitle = 1`
        }
        else {
            return ''
        }
    }
    
}

/**
 * 
 * @param {string} order Order query string.
 * @returns if order query is random it will return 'alt_rj_code % 7', 
 * if not it will return the original order parameter.
 */
function randomOrder(order) {
    if (order === 'random') {
        return `alt_rj_code % 7`
    }
    else {
        return order
    }
}