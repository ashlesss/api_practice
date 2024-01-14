const { db } = require('./metadata')
const { config } = require('../config')

module.exports = {
    getFullRecord,
    getWorks,
    getWorkByKeyword,
    getWorkByKeywordCountWorks
}

/**
 * 
 * @param {object} work Work object
 * @returns Formatted work record.
 */
function getFullRecord(work) {
    delete work.circleObj
    work['rate_count_detail'] = JSON.parse(work.rate_count_detail)
    // work['vas'] = JSON.parse(work.vas)
    // work['tags'] = JSON.parse(work.tags)
    work['language_editions'] = JSON.parse(work.language_editions)
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
    
    const totalWorks = sortSub !== '' ? await db('works_w_metadata_public').whereRaw('has_subtitle = TRUE').count({count: 'rj_code'}) 
        : await db('works_w_metadata_public').count({count: 'rj_code'})
    const totalPage = Math.ceil(totalWorks[0].count / Number(worksPerPage));

    let works = [];

    // Get pagination info first
    const pagination = {
        current_page: page,
        max_page: totalPage,
        total_works: Number(totalWorks[0].count),
    }

    // console.log(curWorks.rows.length !== 0);

    if (curWorks.rows.length !== 0) {
        for (let i = 0; i < curWorks.rows.length; i++) {
            works.push(getFullRecord(curWorks.rows[i]))
        }
    }

    return {pagination: pagination, works: works}
}

/**
 * Parse keywords from accuate search keywrods and plain keywords
 * 
 * @param {string} keywords Keywords
 * @returns 
 */
function parseKeywords(keywords) {
    const regex = /^(\$[^$]+:[^$]+\$)|\s(\$[^$]+:[^$]+\$)/g
    let matched = keywords.match(regex)

    if (!matched) {
        return {
            accurateSearchTerms: [],
            plainKeywords: keywords.trim().split(' ')
        }
    }

    matched = matched.map(kw => kw.trim())

    const plainKeywords = matched.reduce((acc, curr) => {
        return acc.replace(curr, '')
    }, keywords)

    return {
        accurateSearchTerms: splitKeywords(matched),
        plainKeywords: plainKeywords.trim().split(" ")
    }
}

/**
 * 
 * @param {string[]} keywords Accuate search keywords
 * @returns keywords with term and keyword
 */
function splitKeywords(keywords) {
    return keywords.map(kw => {
        let colonIndex = kw.indexOf(':')
        return {
            term: kw.slice(1, colonIndex),
            keyword: kw.slice(colonIndex + 1, -1)
        }
    })
}

// ----------------------------------------------------------------------

/**
 * 
 * @param {string} allTerms Raw keywords
 * @param {string} order 
 * @param {string} sort 
 * @param {integer} subtitle 
 * @param {integer} page 
 * @returns Query result array
 */
async function getWorkByKeyword(allTerms, order, sort, subtitle, page) {
    let pAllTerms = parseKeywords(allTerms)
    const worksPerPage = Number(config.worksPerPage)

    if (pAllTerms.plainKeywords) {
        const matchedRJCode = pAllTerms.plainKeywords.join(' ').match(/(RJ\d{6,8})|(\d{6,8})/i)
        if (matchedRJCode) {
            const firstQuery = await db('works_w_metadata_public')
            .whereLike('rj_code', `%${matchedRJCode[0]}%`)
            .andWhere(function() {
                if (subtitle === 1) {
                    this.where('has_subtitle', '=', 'TRUE')
                }
            })
            
            // Now search for language_editions
            if (firstQuery.length) {
                let language_editions = JSON.parse(firstQuery[0].language_editions)
                // console.log(language_editions);
                if (language_editions.length) {
                    language_editions = language_editions.filter(e => e.workno !== firstQuery[0].rj_code)
                    language_editions.unshift(
                        {workno: firstQuery[0].rj_code}
                    )
                    const workArray  = language_editions.map(e => e.workno)
                    return await db('works_w_metadata_public')
                    .whereIn('rj_code', workArray)
                    .andWhere(function() {
                        if (subtitle === 1) {
                            this.where('has_subtitle', '=', 'TRUE')
                        }
                    })
                    .orderByRaw(`${randomOrder(order)} ${sort}`)
                    .limit(worksPerPage)
                    .offset(((page - 1) * worksPerPage))
                }
                else {
                    return firstQuery
                }
            }
            return []
        }
    }

    // If plainKeywords have RJ code in it, after call for search rj code then 
    // RJ code search expired, it shoudn't continue to check for other keywords.

    let query = db('works_w_metadata_public');
    let price = -1
    let rate = -1
    let sell = -1

    let termsFilteredArray = []
    // for (const acc of pAllTerms.accurateSearchTerms) {
    //     termsArray.push(acc.term)
    // }

    for (const acc of pAllTerms.accurateSearchTerms) {
        if (!acc.term.match(/(sell|price|rate)/i)) {
            if (acc.term.toLowerCase() === 'tag') {
                termsFilteredArray.push({
                    term: 'tags',
                    keyword: acc.keyword
                })
            }
            else if (acc.term.toLowerCase() === 'circle') {
                termsFilteredArray.push({
                    term: 'circleobj',
                    keyword: acc.keyword
                })
            }
            else if (acc.term.toLowerCase() === 'va') {
                termsFilteredArray.push({
                    term: 'vas',
                    keyword: acc.keyword
                })
            }
            
            // query = query.where(function() {
            //     this.whereLike('work_title', `%${acc.keyword}%`)
            //         .orWhereRaw(`tags::text LIKE '%${acc.keyword}%'`)
            //         .orWhereRaw(`circleobj::text LIKE '%${acc.keyword}%'`)
            //         .orWhereRaw(`vas::text LIKE '%${acc.keyword}%'`)
            // });
        }

        switch (acc.term) {
            case 'price':
                price = 0
                if (!isNaN(Number(acc.keyword) && Number(acc.keyword) > price)) {
                    price = Number(acc.keyword)
                }
                break;
            case 'rate':
                rate = 0
                if (!isNaN(Number(acc.keyword) && Number(acc.keyword) > rate)) {
                    rate = Number(acc.keyword)
                }
                break
            case 'sell':
                sell = 0
                if (!isNaN(Number(acc.keyword) && Number(acc.keyword) > sell)) {
                    sell = Number(acc.keyword)
                }
                break
            default:
                continue
        }
    }

    // Query accurate search 
    if (termsFilteredArray.length) {
        // Base term search
        query = query
        .whereRaw(
            `??::text LIKE ?`, 
            [termsFilteredArray[0].term, `%${termsFilteredArray[0].keyword}%`]
        )

        // Search for all terms
        termsFilteredArray.shift()
        termsFilteredArray.forEach(e => {
            // console.log(e.term);
            query = query.andWhereRaw(`??::text LIKE ?`, [e.term, `%${e.keyword}%`])
        })
    }
    
    // Query plain text search
    for (const keyword of pAllTerms.plainKeywords) {
        query = query.andWhere(function() {
            this.whereLike('work_title', `%${keyword}%`)
            .orWhereRaw(`tags::text LIKE '%${keyword}%'`)
            .orWhereRaw(`circleobj::text LIKE '%${keyword}%'`)
            .orWhereRaw(`vas::text LIKE '%${keyword}%'`)
        });
    }

    // Add query parameters for order, sort, subtitle, price, rate, sell
    query = query
    .andWhere(function() {
        if (sell > -1) {
            this.where('dl_count', '>=', sell)
        }
    })
    .andWhere(function() {
        if (rate > -1) {
            this.where('rate_count', '>=', rate)
        }
    })
    .andWhere(function() {
        if (price > -1) {
            this.where('official_price', '>=', price)
        }
    })
    .andWhere(function() {
        if (subtitle === 1) {
            this.where('has_subtitle', '=', 'TRUE')
        }
    })
    .orderByRaw(`${randomOrder(order)} ${sort}`)
    .limit(worksPerPage)
    .offset(((page - 1) * worksPerPage))
    
    return await query;
}

// -----------------------------------------------------------------------

/**
 * 
 * @param {string} allTerms 
 * @param {string} order 
 * @param {string} sort 
 * @param {integer} subtitle 
 * @returns Query result array
 */
async function getWorkByKeywordCountWorks(allTerms, order, sort, subtitle) {
    let pAllTerms = parseKeywords(allTerms)

    if (pAllTerms.plainKeywords) {
        const matchedRJCode = pAllTerms.plainKeywords.join(' ').match(/(RJ\d{6,8})|(\d{6,8})/i)
        if (matchedRJCode) {
            const firstQuery = await db('works_w_metadata_public')
            .whereLike('rj_code', `%${matchedRJCode[0]}%`)
            .andWhere(function() {
                if (subtitle === 1) {
                    this.where('has_subtitle', '=', 'TRUE')
                }
            })
            
            // Now search for language_editions
            if (firstQuery.length) {
                let language_editions = JSON.parse(firstQuery[0].language_editions)
                
                if (language_editions.length) {
                    language_editions = language_editions
                    .filter(e => e.workno !== firstQuery[0].rj_code)

                    language_editions.unshift(
                        {workno: firstQuery[0].rj_code}
                    )
                    const workArray  = language_editions.map(e => e.workno)
                    const query = db('works_w_metadata_public')
                    .select('rj_code')
                    .whereIn('rj_code', workArray)
                    .andWhere(function() {
                        if (subtitle === 1) {
                            this.where('has_subtitle', '=', 'TRUE')
                        }
                    })
                    .orderByRaw(`${randomOrder(order)} ${sort}`)

                    return await db('works_w_metadata_public')
                    .where('rj_code', 'in', query)
                    .count('rj_code')
                }
                else {
                    return [ { count: '1' } ]
                }
            }
            return [ { count: '0' } ]
        }
    }

    // If plainKeywords have RJ code in it, after call for search rj code then 
    // RJ code search expired, it shoudn't continue to check for other keywords.

    let query = db('works_w_metadata_public').select('rj_code')
    let rate = -1
    let sell = -1
    let price = -1

    let termsFilteredArray = []

    for (const acc of pAllTerms.accurateSearchTerms) {
        if (!acc.term.match(/(sell|price|rate)/i)) {
            if (acc.term.toLowerCase() === 'tag') {
                termsFilteredArray.push({
                    term: 'tags',
                    keyword: acc.keyword
                })
            }
            else if (acc.term.toLowerCase() === 'circle') {
                termsFilteredArray.push({
                    term: 'circleobj',
                    keyword: acc.keyword
                })
            }
            else if (acc.term.toLowerCase() === 'va') {
                termsFilteredArray.push({
                    term: 'vas',
                    keyword: acc.keyword
                })
            }
        }

        switch (acc.term) {
            case 'price':
                price = 0
                if (!isNaN(Number(acc.keyword) && Number(acc.keyword) > price)) {
                    price = Number(acc.keyword)
                }
                break;
            case 'rate':
                rate = 0
                if (!isNaN(Number(acc.keyword) && Number(acc.keyword) > rate)) {
                    rate = Number(acc.keyword)
                }
                break
            case 'sell':
                sell = 0
                if (!isNaN(Number(acc.keyword) && Number(acc.keyword) > sell)) {
                    sell = Number(acc.keyword)
                }
                break
            default:
                continue
        }
    }

    // Query accurate search 
    if (termsFilteredArray.length) {
        // Base term search
        query = query
        .whereRaw(
            `??::text LIKE ?`, 
            [termsFilteredArray[0].term, `%${termsFilteredArray[0].keyword}%`]
        )

        // Search for all terms
        termsFilteredArray.shift()
        termsFilteredArray.forEach(e => {
            // console.log(e.term);
            query = query.andWhereRaw(`??::text LIKE ?`, [e.term, `%${e.keyword}%`])
        })
    }
    
    // Query plain text search
    for (const keyword of pAllTerms.plainKeywords) {
        query = query.andWhere(function() {
            this.whereLike('work_title', `%${keyword}%`)
            .orWhereRaw(`tags::text LIKE '%${keyword}%'`)
            .orWhereRaw(`circleobj::text LIKE '%${keyword}%'`)
            .orWhereRaw(`vas::text LIKE '%${keyword}%'`)
        });
    }

    // Add query parameters for order, sort, subtitle, price, rate, sell
    query = query
    .andWhere(function() {
        if (sell > -1) {
            this.where('dl_count', '>=', sell)
        }
    })
    .andWhere(function() {
        if (rate > -1) {
            this.where('rate_count', '>=', rate)
        }
    })
    .andWhere(function() {
        if (price > -1) {
            this.where('official_price', '>=', price)
        }
    })
    .andWhere(function() {
        if (subtitle === 1) {
            this.where('has_subtitle', '=', 'TRUE')
        }
    })
    .orderByRaw(`${randomOrder(order)} ${sort}`)

    return await db('works_w_metadata_public')
    .where('rj_code', 'in', query)
    .count('rj_code')
}

//---------------------------------------------------------------------------

/**
 * 
 * @param {number} subtitle Sorting by has subtitle switch. 1 means on, 0 means off.
 * @param {number} needAND A switch that controls query command format.
 * @returns Query command
 */
function sortBySubtitle(subtitle, needAND) {
    if (needAND === 1) {
        if (subtitle === 1) {
            return `AND has_subtitle = TRUE`
        }
        else {
            return ''
        }
    }
    else {
        if (subtitle === 1) {
            return `WHERE has_subtitle = TRUE`
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