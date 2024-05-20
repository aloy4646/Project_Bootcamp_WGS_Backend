const db = require('../db.js')

//get list users
const getUsers = async () => {
    try {
        const result = await db.query("SELECT id, email_kantor, nama_lengkap, nama_panggilan, role FROM users WHERE role != 'SUPER ADMIN' ORDER BY nama_lengkap ASC")
        return result.rows
    } catch (error) {
        console.error('Error saat mengambil list user: ', error)
        throw error
    }
}

//get user detail
const getUserDetail = async (userId) => {
    try {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [userId])
        return result.rows[0]
    } catch (error) {
        console.error('Error saat mengambil detail user: ', error)
        throw error
    }
}

//createUser
const createUser = async (newUser, idAdmin) => {
    try {
        //langsung membuat log baru saat akun dibuat
        const newLog = [
            JSON.stringify({
                date: new Date(),
                author: idAdmin,
                message: `Akun telah dibuat dengan email kantor: ${newUser.email_kantor}.`,
            }),
        ]

        const newAdminLog = [
            JSON.stringify({
                date: new Date(),
                author: idAdmin,
                message: `Membuat akun dengan email kantor: ${newUser.email_kantor}.`,
            }),
        ]

        var result = await db.query(
            'INSERT INTO users (email_kantor, password, createdAt, logs, histories) VALUES ($1, $2, $3, $4, $5)',
            [newUser.email_kantor, newUser.password, new Date(), newLog, []]
        )

        //update admin
        if (result.rowCount > 0) {
            result = null
            result = await db.query(
                `UPDATE users SET logs = logs || $1 WHERE id = $2`,
                [newAdminLog, idAdmin]
            )
        }

        return result
    } catch (error) {
        console.error('Error saat membuat user baru: ', error)
        throw error
    }
}

//update password
const updateUserPassword = async (userId, password, message) => {
    try {
        const newLog = [
            JSON.stringify({
                date: new Date(),
                author: userId,
                message: `Mengubah password`,
            }),
        ]
        const newHistory = [
            JSON.stringify({
                date: new Date(),
                author: userId,
                old: { password: 'secret' },
                new: { password: 'secret' },
                message: message,
            }),
        ]

        var result = await db.query(
            'UPDATE users SET password = $1, updatedat = NOW(), logs = logs || $2, histories = histories || $3 WHERE id = $4',
            [password, newLog, newHistory, userId]
        )
        return result
    } catch (error) {
        console.error('Error saat mengubah password: ', error)
        throw error
    }
}

//update password by admin
const updateUserPasswordByAdmin = async (userId, idAdmin, password, message) => {
    try {
        const newLog = [
            JSON.stringify({
                date: new Date(),
                author: idAdmin,
                message: `Password diubah oleh admin dengan id: ${idAdmin}`,
            }),
        ]

        const newAdminLog = [
            JSON.stringify({
                date: new Date(),
                author: idAdmin,
                message: `Mengubah password user dengan id: ${userId}`,
            }),
        ]

        const newHistory = [
            JSON.stringify({
                date: new Date(),
                author: userId,
                old: { password: 'secret' },
                new: { password: 'secret' },
                message: message,
            }),
        ]

        var result = await db.query(
            'UPDATE users SET password = $1, updatedat = NOW(), logs = logs || $2, histories = histories || $3 WHERE id = $4',
            [password, newLog, newHistory, userId]
        )

        //update admin
        if (result.rowCount > 0) {
            result = null
            result = await db.query(
                `UPDATE users SET logs = logs || $1 WHERE id = $2`,
                [newAdminLog, idAdmin]
            )
        }

        return result
    } catch (error) {
        console.error('Error saat mengubah password: ', error)
        throw error
    }
}

//find user by email kantor
const findUserByEmailKantor = async (email_kantor) => {
    try {
        const result = await db.query('SELECT * FROM users WHERE email_kantor = $1', [
            email_kantor,
        ])
        if (result.rows.length === 0) {
            return null
        }
        return result.rows[0]
    } catch (error) {
        console.error('Error saat mencari user dengan email kantor: ', error)
        throw error
    }
}

//find user by id
const findUserById = async (userId) => {
    try {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [
            userId,
        ])
        
        if (result.rows.length === 0) {
            return null
        }

        return result.rows[0]
    } catch (error) {
        console.error('Error saat mencari user dengan id: ', error)
        throw error
    }
}

//user melakukan request untuk update data (text maupun file berupa image dan pdf)
const requestUpdate = async (userId, message, oldData, newData) => {
    try {
        const newLog = [
            JSON.stringify({
                date: new Date(),
                author: userId,
                message: `Melakukan request untuk update data karyawan`,
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
        console.error('Error saat membuat request update: ', error)
        throw error
    }
}

//get user data dengan kolom yang diperlukan saja
const getUserData = async (kolom, userId) => {
    try {
        const kumpulanKolom = kolom.join(', ')

        var result = await db.query(
            `SELECT (${kumpulanKolom}) FROM users WHERE id = $1`,
            [userId]
        )

        if (result.rows.length > 0) {
            if (result.rows[0].row) {
                //jika ada data null maka akan diubah menjadi -
                const sanitizedRow = result.rows[0].row.replace(
                    /\(,\)/g,
                    '(-,-)'
                )

                return sanitizedRow
            } else {
                //jika hanya 1 field
                const value = result.rows[0][kumpulanKolom] !== null ? result.rows[0][kumpulanKolom] : '-';
                return value
            }
        }

        return null
    } catch (error) {
        console.error('Error saat mengambil data user: ', error)
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
        console.error('Error saat mengabil logs user: ', error)
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
        console.error('Error saat mengambil histories user: ', error)
        throw error
    }
}

//Ubah role user
const updateUserRole = async (userId, idSuperAdmin, role) => {
    try {
        const newLog = [
            JSON.stringify({
                date: new Date(),
                author: idSuperAdmin,
                message: `Role diubah oleh super admin`,
            }),
        ]

        const newSuperAdminLog = [
            JSON.stringify({
                date: new Date(),
                author: idSuperAdmin,
                message: `Mengubah role user dengan id: ${userId}`,
            }),
        ]

        var result = await db.query(
            'UPDATE users SET role = $1, updatedat = NOW(), logs = logs || $2 WHERE id = $3',
            [role, newLog, userId]
        )

        if(result.rowCount > 0){
            //update super admin
            if (result.rowCount > 0) {
                result = null
                result = await db.query(
                    `UPDATE users SET logs = logs || $1 WHERE id = $2`,
                    [newSuperAdminLog, idSuperAdmin]
                )
            }
        }

        return result

    } catch (error) {
        console.error('Error saat mengubah role user: ', error)
        throw error
    }
}

module.exports = {
    getUsers,
    getUserDetail,
    createUser,
    updateUserPassword,
    updateUserPasswordByAdmin,
    findUserByEmailKantor,
    findUserById,
    requestUpdate,
    getUserData,
    getUserLogs,
    getUserHistories,
    updateUserRole,
}
