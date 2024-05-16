const db = require('../db.js')

//get list update_request yang belum di-accept
const getUpdateRequests = async () => {
    try {
        const result = await db.query(
            'SELECT a.id, a."idUser", b.email_kantor, b.nama_lengkap, a.date, a.message FROM update_request a JOIN users b ON a."idUser" = b.id WHERE a.idAdmin IS NULL OR a.updatedat IS NULL'
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

const getUpdateRequest = async (update_requestId) => {
    try {
        const result = await db.query(
            'SELECT a.*, b.nama_lengkap FROM update_request a JOIN users b ON a."idUser" = b.id WHERE a.id = $1 ',
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
                message: `update request with update_request_id: ${update_request.id} accepted`,
            }),
        ]

        const newAdminLog = [
            JSON.stringify({
                date: new Date(),
                author: idAdmin,
                message: `accepting update request with update_request_id: ${update_request.id} and userId: ${update_request.idUser}`,
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
                message: `update request with update_request_id: ${update_requestId} rejected, reason: ${alasan}`,
            }),
        ]

        const newAdminLog = [
            JSON.stringify({
                date: new Date(),
                author: idAdmin,
                message: `rejecting update request with update_request_id: ${update_requestId} and userId: ${userId}, reason: ${alasan}`,
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

module.exports = {
    getUpdateRequest,
    acceptUpdateRequest,
    rejectUpdateRequest,
    getUpdateRequests,
}
