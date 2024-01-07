
/**
 * Format work results straight from database query
 * @param {object} result Work results
 * @returns Formatted work result, all stringified object parsed to object.
 */
const formatResult = (result) => {
    let formattedResult = []
    if (result.length !== 0) {
        for (let i = 0; i < result.length; i++) {
            delete result[i].circleobj;
            result[i]['rate_count_detail'] = JSON.parse(result[i].rate_count_detail)
            formattedResult.push(result[i])
        }
        return formattedResult
    }
    else {
        return formattedResult
    }
}

module.exports = {
    formatResult
}