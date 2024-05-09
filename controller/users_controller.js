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
        const result = await db.query('INSERT INTO users (email, password, createdAt) VALUES ($1, $2, $3)', [newUser.email, newUser.password, new Date()])
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

const updateUserPhoto = async (userId, filePath, message) => {
    try {
        var result = await db.query('UPDATE users SET foto = ($1), updatedat = NOW() WHERE id = $2', [filePath, userId]);
        
        if(result){
            const newHistory = { "message": message, "acceptBy": "Admin1" };
            const newHistoryJSON = JSON.stringify(newHistory);
            result = addHistory(userId, newHistoryJSON)
        }

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

const updateUserIjazah = async (userId, filePath, message) => {
    try {
        var result = await db.query('UPDATE users SET ijazah = ($1), updatedat = NOW() WHERE id = $2', [filePath, userId]);
        
        if (result) {
            const newHistory = { "message": message, "acceptBy": "Admin1" };
            const newHistoryJSON = JSON.stringify(newHistory);
            result = addHistory(userId, newHistoryJSON)
        }

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

const addHistory = async (userId, newHistoryJSON) => {
    try {
        const result = await db.query('INSERT INTO history ("idUser", history) VALUES ($1, $2)', [userId, newHistoryJSON])
        return result;
    } catch (error) {
        console.error('Error add history:', error);
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
    getUserIjazahPath
 }