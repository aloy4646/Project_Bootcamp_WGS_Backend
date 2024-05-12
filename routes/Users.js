const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const { users_controller } = require('../controller/index')
const { imageUploads } = require('../storage/storage')
const { generateRandomString } = require('../password_generator/generator')
const fs = require('fs')

router.post('/', async (req, res) => {
    try {
        const { email, idAdmin } = req.body

        const password = generateRandomString(6, 10)

        bcrypt.hash(password, 10).then(async (hash) => {
            await users_controller.createUser(
                { email, password: hash },
                idAdmin
            )

            res.json({
                status: 200,
                message: 'registration success',
                data: { email: email, password: password },
            })
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
        console.log({ contacts: contacts })

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

router.put('/password/:userId', async (req, res) => {
    try {
        const userId = req.params.userId
        const { message, password } = req.body

        console.log({ message: message, password: password })

        bcrypt.hash(password, 10).then(async (hash) => {
            await users_controller.updateUserPassword(userId, hash, message)

            res.json({ status: 200, message: 'password changed successfully' })
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

//update request from user (data pribadi, data kerabat dan informasi tambahan)
router.put('/:userId', imageUploads.single('foto'), async (req, res) => {
    try {
        const userId = req.params.userId
        const message = req.body.message

        var arrayKolom = []
        var arrayValue = []

        const propertiesToCheck = [
            'email',
            'nama_lengkap',
            'nama_panggilan',
            'nomor_telepon',
            'email_kantor',
            'alamat_rumah',
            'alamat_tinggal',
            'tempat_lahir',
            'tanggal_lahir',
            'nama_kontak_darurat',
            'nomor_telepon_kontak_darurat',
            'nama_orang_tua',
            'nama_pasangan',
            'nama_saudara',
            'tanggal_masuk',
            'tanggal_keluar',
        ]

        propertiesToCheck.forEach((property) => {
            if (req.body[property]) {
                arrayValue.push(req.body[property])
                arrayKolom.push(property)
            }
        })

        // Cek apakah ada field foto pada request
        if (req.file && req.file.path) {
            arrayValue.push(req.file.path)
            arrayKolom.push('foto')
        }

        var oldData = await users_controller.getUserData(arrayKolom, userId)
        let oldDataCleaned = ''

        if (oldData) {
            //Value dari oldData adalah '(,,,,,)'. kode dibawah digunakan untuk menghapus ( dan )
            let oldDataCleaned = oldData.substring(1)
            oldDataCleaned = oldDataCleaned.substring(
                0,
                oldDataCleaned.length - 1
            )
        }

        // menggabungan nilai dari oldDataCleaned dan arrayKolom
        const oldDataArray = oldDataCleaned.split(',')
        console.log({ oldDataArray: oldDataArray })
        const oldDataJSON = {}
        arrayKolom.forEach((kolom, index) => {
            oldDataJSON[kolom] = oldDataArray[index]
        })

        const newDataJSON = {}
        arrayKolom.forEach((kolom, index) => {
            newDataJSON[kolom] = arrayValue[index]
        })

        const result = await users_controller.updateUserRequest(
            userId,
            message,
            oldDataJSON,
            newDataJSON
        )

        if (!result) {
            throw new Error('Error updating user document')
        }

        res.json({ status: 200, message: 'update request stored' })
    } catch (error) {
        if (req.file && req.file.path) {
            const fotoPath = req.file.path

            // Hapus file jika ada kesalahan
            fs.unlink(fotoPath, (err) => {
                if (err) {
                    console.error('Gagal menghapus file:', err)
                    return
                }
                console.log('File berhasil dihapus:', fotoPath)
            })
        }

        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

router.get('/logs/:userId', async (req, res) => {
    try {
        const userId = req.params.userId
        const logs = await users_controller.getUserLogs(userId)

        // Kirim file sebagai respons JSON
        res.status(200).json({
            status: 200,
            logs,
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

router.get('/histories/:userId', async (req, res) => {
    try {
        const userId = req.params.userId
        const histories = await users_controller.getUserHistories(userId)

        // Kirim file sebagai respons JSON
        res.status(200).json({
            status: 200,
            histories,
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
