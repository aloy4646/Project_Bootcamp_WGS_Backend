const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const { verifyUser } = require('../middleware/AuthUser')

router.get('/', verifyUser, async (req, res) => {
    try {
        if(req.role === 'SUPER ADMIN') {
            res.status(403)
            res.json({ status: 403, error: 'User tidak memiliki akses' })
            return
        }

        const filePath = decodeURIComponent(req.query.filePath)

        const absolutePath = path.resolve(filePath)

        if (fs.existsSync(absolutePath)) {
            res.sendFile(absolutePath)
        } else {
            res.status(404).json({
                status: 404,
                message: 'File not found',
            })
        }
    } catch (error) {
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

module.exports = router
