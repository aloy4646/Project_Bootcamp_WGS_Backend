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
            'INSERT INTO update_request ("idUser", message, old, new, date) VALUES ($1, $2, $3, $4, NOW())',
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
        console.log(kumpulanKolom)

        var result = await db.query(
            `SELECT (${kumpulanKolom}) FROM users WHERE id = $1`,
            [userId]
        )

        console.log({ result: result.rows[0] })

        if (result.rows.length > 0) {
            if (result.rows[0].row) {
                return result.rows[0].row
            } else {
                console.log('masuk sini')
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
    getUserLogs,
    getUserHistories,
}
