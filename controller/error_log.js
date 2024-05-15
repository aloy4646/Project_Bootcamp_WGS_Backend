const db = require('../db.js')

const addErrorLog = async (author, message) => {
    try {
        const error_log = [
            JSON.stringify({
                date: new Date(),
                author: author,
                message: message,
            }),
        ]

        var result = await db.query(
            'UPDATE users SET logs = logs || $1 WHERE id = $2',
            [error_log, error_log.author]
        )

        return result
    } catch (error) {
        throw error
    }
}

module.exports = {
    addErrorLog,
}