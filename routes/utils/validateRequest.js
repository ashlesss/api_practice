const { validationResult } = require('express-validator');

/**
 * 
 * @param {object} req Request body
 * @param {object} res Response body
 * @returns true when pass validation, false when failed the validation.
 */
const validate = (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
        res.status(404).json({errors: result.array()})
        return false
    }
    else {
        return true
    }
}

module.exports = {
    validate
}