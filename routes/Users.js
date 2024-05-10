const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const users_controller = require('../controller/users_controller')
const fs = require('fs')
const mime = require('mime-types')
const {imageUploads, pdfUploads} = require('../storage/storage') 
const { generateRandomString } = require('../password_generator/generator')

router.post('/', async (req, res) => {
    try {
        const {email, idAdmin} = req.body

        const password = generateRandomString(6, 10)

        bcrypt.hash(password, 10).then(async (hash) => {
            await users_controller.createUser({ email, password: hash }, idAdmin)

            res.json({ status: 200, message: 'registration success', data:{email:email, password:password} })
        })
    } catch (error) {
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})
router.get('/', async (req, res) => {
    try {
        console.log({ dirname: __dirname })
        const contacts = await users_controller.getUsers()
        // res.json(contacts)
        res.json({ status: 200, contacts: contacts })
    } catch (error) {
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        const user = await users_controller.findUser(email)

        if (!user) {
            res.status(404)
            res.json({ status: 404, error: 'user does not exist' })
            return
        }

        bcrypt.compare(password, user.password).then((match) => {
            if (!match) {
                res.status(404)
                res.json({
                    status: 404,
                    error: 'wrong email and password combination',
                })
                return
            }

            // res.json({success:"login success"})
            res.json({ status: 200, message: 'login success' })
        })
    } catch (error) {
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

router.put('/photo/:id', imageUploads.single('image'), async (req, res) => {
    try {
        const userId = req.params.id
        const {message, idAdmin} = req.body
        const filePath = req.file.path

        await users_controller.updateUserPhoto(userId, idAdmin, filePath, message)

        res.json({ status: 'image received' })
    } catch (error) {
        const filePath = req.file.path

        // Hapus file jika ada kesalahan
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Gagal menghapus file:', err)
                return
            }
            console.log('File berhasil dihapus:', filePath)
        })
        
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

router.get('/photo/:id', async (req, res) => {
    try {
        const userId = req.params.id
        const filePath = await users_controller.getUserPhotoPath(userId)

        const file = fs.readFileSync(filePath)

        // Encode file menjadi base64
        const fileBase64 = file.toString('base64')

        // Tentukan tipe konten sebagai image/jpeg atau image/png, tergantung pada jenis file
        const contentType = mime.lookup(filePath)
        if (!contentType) {
            throw new Error('Unknown file type')
        }

        // Kirim file sebagai respons JSON
        res.status(200).json({
            status: 200,
            file: fileBase64,
            contentType: contentType,
        })
    } catch (error) {
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

router.put('/ijazah/:id', pdfUploads.single('ijazah'), async (req, res) => {
    try {
        const userId = req.params.id
        const {message, idAdmin} = req.body
        const filePath = req.file.path

        await users_controller.updateUserIjazah(userId, idAdmin, filePath, message)

        res.json({ status: 'ijazah received' })
    } catch (error) {
        const filePath = req.file.path

        // Hapus file jika ada kesalahan
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Gagal menghapus file:', err)
                return
            }
            console.log('File berhasil dihapus:', filePath)
        })

        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

router.get('/ijazah/:id', async (req, res) => {
    try {
        const userId = req.params.id
        const filePath = await users_controller.getUserIjazahPath(userId)

        const file = fs.readFileSync(filePath)

        // Encode file menjadi base64
        const fileBase64 = file.toString('base64')

        // Tentukan tipe konten sebagai pdf, tergantung pada jenis file
        const contentType = mime.lookup(filePath)
        if (!contentType) {
            throw new Error('Unknown file type')
        }

        // Kirim file sebagai respons JSON
        res.status(200).json({
            status: 200,
            file: fileBase64,
            contentType: contentType,
        })
    } catch (error) {
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

router.get('/logs/:id', async (req, res) => {
    try {
        const userId = req.params.id
        const logs = await users_controller.getUserLogs(userId)

        // Kirim file sebagai respons JSON
        res.status(200).json({
            status: 200,
            data: logs
        })
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
