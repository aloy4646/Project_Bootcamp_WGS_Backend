const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')

router.get('/', async (req, res) => {
    try {
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