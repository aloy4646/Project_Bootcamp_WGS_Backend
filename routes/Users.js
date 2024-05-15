const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const { users_controller, error_log_controller } = require('../controller/index')
const { imageUploads } = require('../storage/storage')
const { generateRandomString } = require('../password_generator/generator')
const fs = require('fs')

router.post('/', async (req, res) => {
    try {
        const { email_kantor, idAdmin } = req.body

        const password = generateRandomString(6, 10)

        bcrypt.hash(password, 10).then(async (hash) => {
            await users_controller.createUser(
                { email_kantor, password: hash },
                idAdmin
            )

            res.json({
                status: 200,
                message: 'registration success',
                data: { email_kantor, password },
            })
        })
    } catch (error) {
        await error_log_controller.addErrorLog(req.body.idAdmin, 'Error registing user')

        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

//get list users
router.get('/', async (req, res) => {
    try {
        const listKaryawan = await users_controller.getUsers()

        res.json({ status: 200, listKaryawan })
    } catch (error) {
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

//get user detail
router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId
        const karyawan = await users_controller.getUserDetail(userId)

        res.json({ status: 200, karyawan })
    } catch (error) {
        await error_log_controller.addErrorLog(req.params.userId, 'Error get user detail')

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

        bcrypt.hash(password, 10).then(async (hash) => {
            await users_controller.updateUserPassword(userId, hash, message)

            res.json({ status: 200, message: 'password changed successfully' })
        })
    } catch (error) {
        await error_log_controller.addErrorLog(req.params.userId, 'Error changing user password')

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
        const { email_kantor, password } = req.body

        const user = await users_controller.findUser(email_kantor)

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
            'email_kantor',
            'nama_lengkap',
            'nama_panggilan',
            'nomor_telepon',
            'email_pribadi',
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
            oldDataCleaned = oldData.substring(1)
            oldDataCleaned = oldDataCleaned.substring(
                0,
                oldDataCleaned.length - 1
            )
        }

        // menggabungan nilai dari oldDataCleaned dan arrayKolom
        const oldDataArray = oldDataCleaned.split(',')
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
        
        await error_log_controller.addErrorLog(req.params.userId, 'Error requesting update data')

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
        await error_log_controller.addErrorLog(req.params.userId, 'Error getting user logs')
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
        await error_log_controller.addErrorLog(req.params.userId, 'Error getting user histories')
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

module.exports = router
