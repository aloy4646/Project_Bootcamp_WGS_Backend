const express = require('express')
const router = express.Router()
const { users_controller, error_log_controller } = require('../controller/index')
const { verifyUser, superAdminOnly } = require('../middleware/AuthUser')

//Ubah role user
router.put('/role/:userId', verifyUser, superAdminOnly, async (req, res) => {
    try {
        const userId = req.params.userId
        const role = req.body.role
        const idSuperAdmin = req.userId

        const result = await users_controller.updateUserRole(userId, idSuperAdmin, role)

        if (!result) {
            throw new Error('Error saat merubah role user')
        }

        return res.json({ status: 'success', message: 'Role berhasil diubah', data: {userId, role} })
    } catch (error) {
        await error_log_controller.addErrorLog(req.userId, 'Error saat merubah role user: ' + error.message)
        res.status(500)
        res.json({
            status: 'failed',
            message: 'Internal Server Error',
            error: error,
        })
    }
})

//get user role
router.get('/role/:userId', verifyUser, superAdminOnly, async (req, res) => {
    try {
        const userId = req.params.userId

        const result = await users_controller.getUserRole(userId)

        if (!result) {
            throw new Error('Error saat mengambil role user')
        }

        return res.json({ status: 'success', message: 'Role berhasil diambil', data: {role: result} })
    } catch (error) {
        await error_log_controller.addErrorLog(req.userId, 'Error saat mengambil role user: ' + error.message)
        res.status(500)
        res.json({
            status: 'failed',
            message: 'Internal Server Error',
            error: error,
        })
    }
})

module.exports = router