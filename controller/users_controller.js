const db = require('../db.js')

const getUsers = async () => {
    try {
        const result = await db.query('SELECT email FROM users')
        return result.rows
    } catch (error) {
        console.error('Error fetching contacts:', error)
        throw error
    }
}

const createUser = async (newUser, idAdmin) => {
    try {
        //langsung membuat log baru saat akun dibuat
        const newLog = [
            JSON.stringify({
                date: new Date(),
                author: idAdmin,
                message: 'account created',
            }),
        ]

        const result = await db.query(
            'INSERT INTO users (email, password, createdAt, logs, histories) VALUES ($1, $2, $3, $4, $5)',
            [newUser.email, newUser.password, new Date(), newLog, []]
        )
        return result
    } catch (error) {
        console.error('Error menambahkan user:', error)
        throw error
    }
}

const updateUserPassword = async (userId, password, message) => {
    try {
        const newLog = [
            JSON.stringify({
                date: new Date(),
                author: userId,
                message: 'password updated',
            }),
        ]
        const newHistory = [
            JSON.stringify({
                date: new Date(),
                author: userId,
                old: 'secret',
                new: 'secret',
                message: message,
            }),
        ]

        var result = await db.query(
            'UPDATE users SET password = $1, updatedat = NOW(), logs = logs || $2, histories = histories || $3 WHERE id = $4',
            [password, newLog, newHistory, userId]
        )
        return result
    } catch (error) {
        console.error('Error mengganti password user:', error)
        throw error
    }
}

const findUser = async (email) => {
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [
            email,
        ])
        if (result.rows.length === 0) {
            return null
        }
        return result.rows[0]
    } catch (error) {
        console.error('Error fetching contacts:', error)
        throw error
    }
}

const updateUserRequest = async (userId, message, oldData, newData) => {
    try {
        const newLog = [
            JSON.stringify({
                date: new Date(),
                author: userId,
                message: 'requesting to update data',
            }),
        ]

        var result = await db.query(
            'INSERT INTO update_wait ("idUser", message, old, new, date) VALUES ($1, $2, $3, $4, NOW())',
            [userId, message, oldData, newData]
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
        console.error('Error updating user document:', error)
        throw error
    }
}

const getUserData = async (kolom, userId) => {
    try {
        const kumpulanKolom = kolom.join(', ')

        var result = await db.query(
            `SELECT (${kumpulanKolom}) FROM users WHERE id = $1`,
            [userId]
        )

        if (result.rows.length > 0) {
            if (result.rows[0].row) {
                return result.rows[0].row
            }else{
                //jika hanya 1 field
                return result.rows[0][kumpulanKolom]
            }
        }

        return null
    } catch (error) {
        console.error('Error updating user document:', error)
        throw error
    }
}


const getUpdateWait = async (update_waitId) => {
    try {
        const result = await db.query('SELECT * FROM update_wait WHERE id = $1', [update_waitId])
        if (result.rows.length === 0) {
            return null
        }
        return result.rows[0]

    } catch (error) {
        console.error('Error getting update wait:', error)
        throw error
    }
}

const acceptUpdateRequest = async (update_wait, idAdmin, stringQuery) => {
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
                old: update_wait.old,
                new: update_wait.new,
                message: update_wait.message,
            }),
        ]

        var result = await db.query(
            `UPDATE users SET ${stringQuery}, updatedat = NOW(), logs = logs || $1, histories = histories || $2 WHERE id = $3`,
            [newUserLog, newUserHistory, update_wait.idUser]
        )

        if (result.rowCount > 0) {
            result = null
            result = await db.query(
                `UPDATE users SET logs = logs || $1 WHERE id = $2`,
                [newAdminLog, idAdmin]
            )
        }

        if (result.rowCount > 0) {
            result = null
            result = await db.query(
                `UPDATE update_wait SET accepted = true WHERE id = $1`,
                [update_wait.id]
            )
        }
        
        if (result.rowCount > 0) {
            return result
        }

        return null

    } catch (error) {
        console.error('Error getting update wait:', error)
        throw error
    }
}


const updateUserPhoto = async (userId, idAdmin, filePath, message) => {
    try {
        const oldPhotoPath = await getUserPhotoPath(userId)

        const newLog = [
            JSON.stringify({
                date: new Date(),
                message: 'sent update request',
            }),
        ]
        const newHistory = [
            JSON.stringify({
                date: new Date(),
                author: idAdmin,
                old: oldPhotoPath,
                new: filePath,
                message: message,
            }),
        ]

        var result = await db.query(
            'UPDATE users SET foto = $1, updatedat = NOW(), logs = logs || $2, histories = histories || $3 WHERE id = $4',
            [filePath, newLog, newHistory, userId]
        )

        return result
    } catch (error) {
        console.error('Error updating user photo:', error)
        throw error
    }
}

const getUserPhotoPath = async (userId) => {
    try {
        const result = await db.query('SELECT foto FROM users WHERE id = $1', [
            userId,
        ])
        if (result.rows.length > 0) {
            return result.rows[0].foto
        } else {
            return null
        }
    } catch (error) {
        console.error('Error getting user photo:', error)
        throw error
    }
}

const updateUserIjazah = async (userId, idAdmin, filePath, message) => {
    try {
        const oldIjazahPath = await getUserIjazahPath(userId)

        const newLog = [
            JSON.stringify({
                date: new Date(),
                author: idAdmin,
                message: 'account updated',
            }),
        ]
        const newHistory = [
            JSON.stringify({
                date: new Date(),
                author: idAdmin,
                old: oldIjazahPath,
                new: filePath,
                message: message,
            }),
        ]

        var result = await db.query(
            'UPDATE users SET ijazah = $1, updatedat = NOW(), logs = logs || $2, histories = histories || $3 WHERE id = $4',
            [filePath, newLog, newHistory, userId]
        )

        return result
    } catch (error) {
        console.error('Error updating user ijazah:', error)
        throw error
    }
}

const getUserIjazahPath = async (userId) => {
    try {
        const result = await db.query(
            'SELECT ijazah FROM users WHERE id = $1',
            [userId]
        )
        if (result.rows.length > 0) {
            return result.rows[0].ijazah
        } else {
            return null // Atau throw new Error('User photo not found');
        }
    } catch (error) {
        console.error('Error getting user ijazah:', error)
        throw error
    }
}

const getUserLogs = async (userId) => {
    try {
        const result = await db.query('SELECT logs FROM users WHERE id = $1', [
            userId,
        ])
        if (result.rows.length > 0) {
            return result.rows[0].logs
        } else {
            return null
        }
    } catch (error) {
        console.error('Error getting user logs:', error)
        throw error
    }
}

const getUserHistories = async (userId) => {
    try {
        const result = await db.query(
            'SELECT histories FROM users WHERE id = $1',
            [userId]
        )

        if (result.rows.length > 0) {
            return result.rows[0].histories
        } else {
            return null
        }
    } catch (error) {
        console.error('Error getting user histories:', error)
        throw error
    }
}

module.exports = {
    getUsers,
    createUser,
    updateUserPassword,
    findUser,
    updateUserRequest,
    getUserData,
    getUpdateWait,
    acceptUpdateRequest,
    getUserLogs,
    getUserHistories,
}
