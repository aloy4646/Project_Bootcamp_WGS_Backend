const { users_controller } = require('../controller/index')

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
            res.json({ status: 404, error: 'user not found' })
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

const adminOnly = async (req, res, next ) => {
    try {
        if(req.role !== 'ADMIN'){
            res.status(403)
            res.json({ status: 403, error: 'user not authorized' })
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
}