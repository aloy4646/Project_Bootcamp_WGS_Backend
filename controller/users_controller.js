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

const createUser = async (newUser) => {
    try {
        const result = await db.query('INSERT INTO users (email, password) VALUES ($1, $2)', [newUser.email, newUser.password])
        return result
    } catch (error) {
        console.error('Error menambahkan user:', error)
        throw error
    }
}

const findUser = async (email) => {
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email])
        if (result.rows.length === 0) {
            return null
        }
        return result.rows[0]
    } catch (error) {
        console.error('Error fetching contacts:', error)
        throw error
    }
}


module.exports = { 
    getUsers,
    createUser,
    findUser
 }