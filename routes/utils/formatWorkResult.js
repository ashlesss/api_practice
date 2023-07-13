
/**
 * Format work results straight from database query
 * @param {object} result Work results
 * @returns Formatted work result, all stringified object parsed to object.
 */
const formatResult = (result) => {
    let formattedResult = []
    if (result.length !== 0) {
        for (let i = 0; i < result.length; i++) {
            delete result[i].circleObj;
            result[i]['rate_count_detail'] = JSON.parse(result[i].rate_count_detail)
            result[i]['vas'] = JSON.parse(result[i].vas)
            result[i]['tags'] = JSON.parse(result[i].tags)
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