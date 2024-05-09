const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const users_controller = require('../controller/users_controller')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const mime = require('mime-types')

// Fungsi untuk membuat konfigurasi penyimpanan dan middleware upload multer
function createUploadConfig(destinationFolder, allowedExtensions) {
    const storage = multer.diskStorage({
        destination: function (req, file, callback) {
            const uploadPath = path.join(__dirname, destinationFolder)
            callback(null, uploadPath)
        },
        filename: function (req, file, callback) {
            callback(null, Date.now() + '-' + file.originalname)
        },
    })

    const upload = multer({
        storage: storage,
        fileFilter: function (req, file, callback) {
            const fileExt = path.extname(file.originalname).toLowerCase()
            if (allowedExtensions.includes(fileExt)) {
                return callback(null, true)
            } else {
                return callback(
                    new Error(
                        `Only ${allowedExtensions.join(', ')} files are allowed`
                    )
                )
            }
        },
    })

    return upload
}

// Konfigurasi upload untuk gambar
const imageUploads = createUploadConfig('../public/imageUploads', [
    '.png',
    '.jpg',
    '.jpeg',
])

// Konfigurasi upload untuk PDF
const pdfUploads = createUploadConfig('../public/pdfUploads', ['.pdf'])

router.post('/', async (req, res) => {
    try {
        const { email, password } = req.body

        bcrypt.hash(password, 10).then(async (hash) => {
            await users_controller.createUser({ email, password: hash })

            res.json({ status: 200, message: 'registration success' })
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
        const message = req.body.message
        const filePath = req.file.path

        await users_controller.updateUserPhoto(userId, filePath, message)

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
        const message = req.body.message
        const filePath = req.file.path

        await users_controller.updateUserIjazah(userId, filePath, message)

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

module.exports = router
