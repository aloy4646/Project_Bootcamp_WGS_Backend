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
                message: `Menambah sertifikat: ${sertifikat.nama}`,
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
        console.error('Error saat menambahkan sertifikat: ', error)
        throw error
    }
}

//get list sertifikat dari user
const getUserSertifikat = async (userId) => {
    try {
        const result = await db.query(
            'SELECT id, "idUser", nama, organisasi_penerbit, tanggal_terbit, tanggal_expired FROM sertifikat WHERE "idUser" = $1 ORDER BY tanggal_terbit DESC',
            [userId]
        )

        if (result) {
            if (result.rows && result.rows.length > 0) {
                return result.rows
            } else {
                // Data ditemukan tetapi kosong
                return []
            }
        } else {
            return null
        }
    } catch (error) {
        console.error('Error saat mengambil list sertifikat user: ', error)
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
        console.error('Error saat mengambil detail dari sertifikat user: ', error)
        throw error
    }
}

const deleteSertifikat = async (userId, sertifikatId) => {
    try {
        const newLog = [
            JSON.stringify({
                date: new Date(),
                author: userId,
                message: 'Menghapus sertifikat',
            }),
        ]

        var result = await db.query(
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
        console.error('Error saat menghapus sertifikat: ', error)
        throw error
    }
}

const updateSertifikat = async (userId, sertifikatId, stringQuery) => {
    try {
        const newLog = [
            JSON.stringify({
                date: new Date(),
                author: userId,
                message: 'Mengubah sertifikat',
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
        console.error('Error saat mengubah sertifikat: ', error)
        throw error
    }
}


const getSertifikatBySertifikatId = async (sertifikatId) => {
    try {
        const result = await db.query('SELECT * FROM sertifikat WHERE id = $1', [sertifikatId])
        return result.rows[0]
    } catch (error) {
        console.error('Error saat mengambil sertifikat dengan sertifikatId: ', error)
        throw error
    }
}

module.exports = {
    addSertifikat,
    getUserSertifikat,
    getDetailSertifikat,
    deleteSertifikat,
    updateSertifikat,
    getSertifikatBySertifikatId,
}
