const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const { verifyUser } = require('../middleware/AuthUser')
const { error_log_controller } = require('../controller/index')

router.get('/', verifyUser, async (req, res) => {
    try {
        if (req.role === 'SUPER ADMIN') {
            res.status(403).json({ status: 'failed', error: 'User tidak memiliki akses' })
            return
        }

        const filePath = decodeURIComponent(req.query.filePath)

        // Menggunakan path relatif dari direktori storage
        const absolutePath = path.resolve(__dirname, '.', 'storage', filePath)

        if (fs.existsSync(absolutePath)) {
            res.sendFile(absolutePath)
        } else {
            res.status(404).json({
                status: 404,
                message: 'File not found',
            })
        }
    } catch (error) {
        await error_log_controller.addErrorLog(req.userId, 'Error saat mengambil file: ' + error.message)

        res.status(500)
        res.json({
            status: 'failed',
            message: 'Internal Server Error',
            error: error,
        })
    }
})

module.exports = router
