const db = require('../db.js')

const getUpdateRequest = async (update_requestId) => {
    try {
        const result = await db.query(
            'SELECT * FROM update_request WHERE id = $1',
            [update_requestId]
        )
        if (result.rows.length === 0) {
            return null
        }
        return result.rows[0]
    } catch (error) {
        console.error('Error getting update request:', error)
        throw error
    }
}

const acceptUpdateRequest = async (update_request, idAdmin, stringQuery) => {
    try {
        const newUserLog = [
            JSON.stringify({
                date: new Date(),
                author: idAdmin,
                message: 'update request accepted',
            }),
        ]

        const newAdminLog = [
            JSON.stringify({
                date: new Date(),
                author: idAdmin,
                message: 'accepting update request',
            }),
        ]

        const newUserHistory = [
            JSON.stringify({
                date: new Date(),
                author: idAdmin,
                old: update_request.old,
                new: update_request.new,
                message: update_request.message,
            }),
        ]

        //update user
        var result = await db.query(
            `UPDATE users SET ${stringQuery}, updatedat = NOW(), logs = logs || $1, histories = histories || $2 WHERE id = $3`,
            [newUserLog, newUserHistory, update_request.idUser]
        )

        //update admin
        if (result.rowCount > 0) {
            result = null
            result = await db.query(
                `UPDATE users SET logs = logs || $1 WHERE id = $2`,
                [newAdminLog, idAdmin]
            )
        }

        //update update_request. Jika idAdmin dan updateAt tidak null maka update sudah di-accept
        if (result.rowCount > 0) {
            result = null
            result = await db.query(
                `UPDATE update_request SET idAdmin = $1, updatedat = NOW() WHERE id = $2`,
                [idAdmin, update_request.id]
            )
        }

        if (result.rowCount > 0) {
            return result
        }

        return null
    } catch (error) {
        console.error('Error accepting update request:', error)
        throw error
    }
}

const rejectUpdateRequest = async (
    update_requestId,
    idAdmin,
    userId,
    alasan
) => {
    try {
        const newUserLog = [
            JSON.stringify({
                date: new Date(),
                author: idAdmin,
                message: `update request rejected, reason: ${alasan}`,
            }),
        ]

        const newAdminLog = [
            JSON.stringify({
                date: new Date(),
                author: idAdmin,
                message: `rejecting update request, reason: ${alasan}`,
            }),
        ]

        //update log user
        var result = await db.query(
            `UPDATE users SET logs = logs || $1 WHERE id = $2`,
            [newUserLog, userId]
        )

        //update log admin
        if (result.rowCount > 0) {
            result = null
            result = await db.query(
                `UPDATE users SET logs = logs || $1 WHERE id = $2`,
                [newAdminLog, idAdmin]
            )
        }

        //delete update request
        if (result.rowCount > 0) {
            result = null
            result = await db.query(
                `DELETE FROM update_request WHERE id = $1`,
                [update_requestId]
            )
        }

        if (result.rowCount > 0) {
            return result
        }

        return null
    } catch (error) {
        console.error('Error rejecting update request:', error)
        throw error
    }
}

//get update_request yang belum di-accept
const getUpdateRequests = async () => {
    try {
        const result = await db.query(
            'SELECT * FROM update_request WHERE idAdmin IS NULL OR updatedat IS NULL'
        )
        if (result.rows) {
            return result.rows
        }

        return null
    } catch (error) {
        console.error('Error getting list update requests:', error)
        throw error
    }
}

module.exports = {
    getUpdateRequest,
    acceptUpdateRequest,
    rejectUpdateRequest,
    getUpdateRequests,
}
