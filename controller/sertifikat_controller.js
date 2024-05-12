const db = require('../db.js')

const addSertifikat = async (userId, sertifikat) => {
    try {
        //mengambil nama kolom pada object sertifikat
        const kolomName = Object.keys(sertifikat)
        const kolomNameString = kolomName.join(', ')

        //placeholderValues untuk membuat $2, $3, dst pada kode sql ($1 untuk userId)
        const placeholderValues = kolomName
            .map((_, index) => `$${index + 2}`)
            .join(', ')

        //untuk mengisi value pada kode sql
        const sertifikatValues = kolomName.map((kolom) => sertifikat[kolom])

        const newUserLog = [
            JSON.stringify({
                date: new Date(),
                author: userId,
                message: `add sertifikat: ${sertifikat.nama}`,
            }),
        ]

        //update log user
        var result = await db.query(
            `UPDATE users SET logs = logs || $1 WHERE id = $2`,
            [newUserLog, userId]
        )

        //add sertifikat
        if (result.rowCount > 0) {
            result = null
            result = await db.query(
                `INSERT INTO sertifikat ("idUser", ${kolomNameString}, createdat) VALUES ($1, ${placeholderValues}, NOW())`,
                [userId, ...sertifikatValues]
            )
        }

        if (result.rowCount > 0) {
            return result
        }

        return null
    } catch (error) {
        console.error('Error adding sertifikat:', error)
        throw error
    }
}

const getUserSertifikat = async (userId) => {
    try {
        const result = await db.query(
            'SELECT * FROM sertifikat WHERE "idUser" = $1 ORDER BY tanggal_terbit DESC',
            [userId]
        )
        if (result.rows.length > 0) {
            return result.rows
        } else {
            return null
        }
    } catch (error) {
        console.error('Error getting user sertifikat:', error)
        throw error
    }
}

const getDetailSertifikat = async (userId, sertifikatId) => {
    try {
        const result = await db.query(
            'SELECT * FROM sertifikat WHERE id = $1 AND "idUser" = $2',
            [sertifikatId, userId]
        )
        if (result.rowCount > 0) {
            return result.rows[0]
        } else {
            return null
        }
    } catch (error) {
        console.error('Error getting user sertifikat detail:', error)
        throw error
    }
}

const deleteSertifikat = async (userId, sertifikatId) => {
    try {
        const newLog = [
            JSON.stringify({
                date: new Date(),
                author: userId,
                message: 'updating sertifikat',
            }),
        ]

        const result = await db.query(
            'DELETE FROM sertifikat WHERE id = $1 AND "idUser" = $2',
            [sertifikatId, userId]
        )

        if (result.rowCount > 0) {
            result = null
            result = await db.query(
                'UPDATE users SET logs = logs || $1 WHERE id = $2',
                [newLog, userId]
            )  
        }
            
        return result
    } catch (error) {
        console.error('Error deleting sertifikat:', error)
        throw error
    }
}

const updateSertifikat = async (userId, sertifikatId, stringQuery) => {
    try {
        const newLog = [
            JSON.stringify({
                date: new Date(),
                author: userId,
                message: 'updating sertifikat',
            }),
        ]

        //update sertifikat
        var result = await db.query(
            `UPDATE sertifikat SET ${stringQuery}, updatedat = NOW() WHERE id = $1 AND "idUser" = $2`,
            [sertifikatId, userId]
        )

        if (result.rowCount > 0) {
            result = null
            result = await db.query(
                'UPDATE users SET logs = logs || $1 WHERE id = $2',
                [newLog, userId]
            )
        }

        return result
    } catch (error) {
        console.error('Error updating sertifikat:', error)
        throw error
    }
}

module.exports = {
    addSertifikat,
    getUserSertifikat,
    getDetailSertifikat,
    deleteSertifikat,
    updateSertifikat,
}
