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
        //membuat history baru dan langsung dijadikan array untuk inisiasi
        const newLog = [JSON.stringify({ "date": new Date(), "author": idAdmin, "message": "account created"})]

        const result = await db.query('INSERT INTO users (email, password, createdAt, logs) VALUES ($1, $2, $3, $4)', [newUser.email, newUser.password, new Date(), newLog])
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

const updateUserPhoto = async (userId, idAdmin, filePath, message) => {
    try {
        const oldPhotoPath = await getUserPhotoPath(userId);

        const newLog = [JSON.stringify({ "date": new Date(), "author": idAdmin, "message": "account updated"})]
        const newHistory = [JSON.stringify({"date": new Date(), "author": idAdmin, "old": oldPhotoPath, "new": filePath, "message": message})]

        var result = await db.query('UPDATE users SET foto = $1, updatedat = NOW(), logs = logs || $2, histories = histories || $3 WHERE id = $4', 
                                    [filePath, newLog, newHistory, userId]);        

        return result;
    } catch (error) {
        console.error('Error updating user photo:', error);
        throw error;
    }
}

const getUserPhotoPath = async (userId) => {
    try {
        const result = await db.query('SELECT foto FROM users WHERE id = $1', [userId]);
        if (result.rows.length > 0) {
            return result.rows[0].foto;
        } else {
            return null; // Atau throw new Error('User photo not found');
        }
    } catch (error) {
        console.error('Error getting user photo:', error);
        throw error;
    }
}

const updateUserIjazah = async (userId, idAdmin, filePath, message) => {
    try {
        const oldIjazahPath = await getUserIjazahPath(userId);

        const newLog = [JSON.stringify({ "date": new Date(), "author": idAdmin, "message": "account updated"})]
        const newHistory = [JSON.stringify({"date": new Date(), "author": idAdmin, "old": oldIjazahPath, "new": filePath, "message": message})]

        var result = await db.query('UPDATE users SET ijazah = $1, updatedat = NOW(), logs = logs || $2, histories = histories || $3 WHERE id = $4', 
                                    [filePath, newLog, newHistory, userId]);        

        return result;
    } catch (error) {
        console.error('Error updating user ijazah:', error);
        throw error;
    }
}

const getUserIjazahPath = async (userId) => {
    try {
        const result = await db.query('SELECT ijazah FROM users WHERE id = $1', [userId]);
        if (result.rows.length > 0) {
            return result.rows[0].ijazah;
        } else {
            return null; // Atau throw new Error('User photo not found');
        }
    } catch (error) {
        console.error('Error getting user ijazah:', error);
        throw error;
    }
}

const getUserLogs = async (userId) => {
    try {
        const result = await db.query('SELECT logs FROM users WHERE id = $1', [userId]);
        if (result.rows.length > 0) {
            return result.rows[0].logs;
        } else {
            return null; 
        }
    } catch (error) {
        console.error('Error getting user ijazah:', error);
        throw error;
    }
}


module.exports = { 
    getUsers,
    createUser,
    findUser,
    updateUserPhoto,
    getUserPhotoPath,
    updateUserIjazah,
    getUserIjazahPath,
    getUserLogs
 }