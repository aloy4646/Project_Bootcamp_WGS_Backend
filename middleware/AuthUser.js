const { users_controller } = require('../controller/index')

//middleware untuk mengecek apakah ada session
const verifyUser = async (req, res, next ) => {
    try {
        if(!req.session.userId){
            return res.status(401).json({
                status: 401,
                error: 'Session tidak ada, mohon login ke akun anda',
            })
        }

        const user = await users_controller.findUserById(req.session.userId)

        if (!user) {
            res.status(404)
            res.json({ status: 404, error: 'User tidak ditemukan' })
            return
        }

        req.userId = user.id
        req.role = user.role
        next()
    } catch (error) {
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
}

//middleware untuk mengecek apakah role dari user adalah admin
const adminOnly = async (req, res, next ) => {
    try {
        if(req.role !== 'ADMIN'){
            res.status(403)
            res.json({ status: 403, error: 'User tidak memiliki akses' })
            return
        }

        next()
    } catch (error) {
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
}

//middleware untuk mengecek apakah role dari user adalah super admin
const superAdminOnly = async (req, res, next ) => {
    try {
        if(req.role !== 'SUPER ADMIN'){
            res.status(403)
            res.json({ status: 403, error: 'User tidak memiliki akses' })
            return
        }

        next()
    } catch (error) {
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
}

//middleware untuk mengecek apakah role dari user adalah super admin atau admin
const superAdminOrAdminOnly = async (req, res, next ) => {
    try {
        if(req.role !== 'SUPER ADMIN' && req.role !== 'ADMIN'){
            res.status(403)
            res.json({ status: 403, error: 'User tidak memiliki akses' })
            return
        }

        next()
    } catch (error) {
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
}

//middleware untuk mengecek apakah role dari user adalah admin atau auditor
const adminOrAuditorOnly = async (req, res, next ) => {
    try {
        if(req.role !== 'ADMIN' && req.role !== 'AUDITOR'){
            res.status(403)
            res.json({ status: 403, error: 'User tidak memiliki akses' })
            return
        }

        next()
    } catch (error) {
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
}

module.exports = {
    verifyUser,
    adminOnly,
    superAdminOnly,
    superAdminOrAdminOnly,
    adminOrAuditorOnly,
}