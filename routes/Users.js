const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const { users_controller, error_log_controller } = require('../controller/index')
const { imageUploads } = require('../storage/storage')
const { generateRandomString } = require('../password_generator/generator')
const fs = require('fs')
const path = require('path')
const { verifyUser, superAdminOrAdminOnly, adminOrAuditorOnly } = require('../middleware/AuthUser')

//create user
router.post('/', verifyUser, superAdminOrAdminOnly, async (req, res) => {
    try {
        const { email_kantor, idAdmin } = req.body

        const user = await users_controller.findUserByEmailKantor(email_kantor)

        if(user){
            return res.status(400).json({
                status: 400,
                error: 'Email sudah ada, silahkan gunakan email lain',
            })
        }

        const password = generateRandomString(6, 10)

        bcrypt.hash(password, 10).then(async (hash) => {
            await users_controller.createUser(
                { email_kantor, password: hash },
                idAdmin
            )

            res.json({
                status: 200,
                message: 'Proses penambahan user berhasil',
                data: { email_kantor, password },
            })
        })
    } catch (error) {
        await error_log_controller.addErrorLog(req.body.idAdmin, 'Error saat menambah user')

        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

//Get list users
router.get('/', verifyUser, async (req, res) => {
    try {
        const listUser = await users_controller.getUsers()

        if(req.role === 'USER') {
            res.status(403)
            res.json({ status: 403, error: 'User tidak memiliki akses' })
            return
        }

        res.json({ status: 200, listUser })
    } catch (error) {
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

//get user detail (seluruh data)
router.get('/:userId', verifyUser, async (req, res) => {
    try {
        const userId = req.params.userId
        const user = await users_controller.getUserDetail(userId)

        if(userId != req.userId && req.role !== 'ADMIN' && req.role !== 'AUDITOR') {
            res.status(403)
            res.json({ status: 403, error: 'User tidak memiliki akses' })
            return
        }

        res.json({ status: 200, user })
    } catch (error) {
        await error_log_controller.addErrorLog(req.params.userId, 'Error saat mengambil seluruh detail user')

        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})


//get user data (data text dan image)
router.get('/data/:userId', verifyUser, async (req, res) => {
    try {
        const userId = req.params.userId

        if(userId != req.userId && req.role !== 'ADMIN') {
            res.status(403)
            res.json({ status: 403, error: 'User tidak memiliki akses' })
            return
        }

        var arrayKolom = [
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
            'foto',
        ]

        const userResult = await users_controller.getUserData(arrayKolom, userId)
        let userString = ''
        if (userResult && userResult.startsWith('(') && userResult.endsWith(')')) {
            //Value dari userResult adalah '(,,,,,)'. kode dibawah digunakan untuk menghapus ( dan )
            userString = userResult.substring(1)
            userString = userString.substring(
                0,
                userString.length - 1
            )
        }else{
            userString = userResult
        }

        const userArray = userString.split(',');

        // Menggabungkan arrayKolom dan fileArray menjadi objek user
        const user = arrayKolom.reduce((acc, kolom, index) => {
            acc[kolom] = userArray[index].trim().replace(/"/g, ''); // Menghilangkan spasi dan tanda kutip ganda
            return acc;
        }, {})

        res.json({ status: 200, user })
    } catch (error) {
        await error_log_controller.addErrorLog(req.params.userId, 'Error saat mengambil user data (text dan image): ' + error.message)

        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

//get user dokumen (data pdf)
router.get('/dokumen/:userId', verifyUser, async (req, res) => {
    try {
        const userId = req.params.userId

        if(userId != req.userId && req.role !== 'ADMIN') {
            res.status(403)
            res.json({ status: 403, error: 'User tidak memiliki akses' })
            return
        }

        var arrayKolom = [
            'ktp',
            'npwp',
            'ijazah',
            'transkrip_nilai',
            'cv_pribadi',
            'cv_perusahaan',
        ]

        const userResult = await users_controller.getUserData(arrayKolom, userId)

        let userString = ''
        if (userResult && userResult.startsWith('(') && userResult.endsWith(')')) {
            //Value dari userResult adalah '(,,,,,)'. kode dibawah digunakan untuk menghapus ( dan )
            userString = userResult.substring(1)
            userString = userString.substring(
                0,
                userString.length - 1
            )
        }else{
            userString = userResult
        }

        const userArray = userString.split(',');

        // Menggabungkan arrayKolom dan fileArray menjadi objek user
        const user = arrayKolom.reduce((acc, kolom, index) => {
            acc[kolom] = userArray[index].trim().replace(/"/g, ''); // Menghilangkan spasi dan tanda kutip ganda
            return acc;
        }, {})

        res.json({ status: 200, user })
    } catch (error) {
        await error_log_controller.addErrorLog(req.params.userId, 'Error saat mengambil user data (dokumen pdf): ' + error.message)

        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

//Update Password
router.put('/password/:userId', verifyUser, async (req, res) => {
    try {
        const userId = req.params.userId
        if(userId != req.userId){
            res.status(403)
            res.json({ status: 403, error: 'User tidak memiliki akses' })
            return
        }
        const { old_password, new_password } = req.body

        const message = "Update password"

        const user = await users_controller.findUserById(userId)

        const match = await bcrypt.compare(old_password, user.password)
        if (!match) {
            return res.status(400).json({
                status: 400,
                error: 'Password lama salah',
            })
        }

        const hash = await bcrypt.hash(new_password, 10)
        const result = await users_controller.updateUserPassword(userId, hash, message)

        if (!result) {
            throw new Error('Error saat megnubah password')
        }

        return res.json({ status: 200, message: 'Password berhasil diubah' })
    } catch (error) {
        await error_log_controller.addErrorLog(req.params.userId, 'Error saat mengubah password: ' + error.message)

        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

//Request Update User Data (data text dan image)
router.put('/:userId', verifyUser, imageUploads.single('foto'), async (req, res) => {
    try {
        const userId = req.params.userId
        const message = req.body.message

        if(userId != req.userId && req.role !== 'ADMIN') {
            res.status(403)
            res.json({ status: 403, error: 'User tidak memiliki akses' })
            return
        }

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
            const relativePath = path.relative(
                path.join(__dirname, 'storage'),
                req.file.path
            )
            arrayValue.push(relativePath)
            arrayKolom.push('foto')
        }

        var oldData = await users_controller.getUserData(arrayKolom, userId)
        let oldDataCleaned = ''
        if (oldData && oldData.startsWith('(') && oldData.endsWith(')')) {
            //Value dari oldData adalah '(,,,,,)'. kode dibawah digunakan untuk menghapus ( dan )
            oldDataCleaned = oldData.substring(1)
            oldDataCleaned = oldDataCleaned.substring(
                0,
                oldDataCleaned.length - 1
            )
        } else {
            oldDataCleaned = oldData
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

        const result = await users_controller.requestUpdate(
            userId,
            req.userId,
            message,
            oldDataJSON,
            newDataJSON
        )

        if (!result) {
            throw new Error('Error saat request update data user')
        }

        res.json({ status: 200, message: 'Request update berhasil tersimpan, silahkan tunggu konfirmasi dari admin' })
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
        
        await error_log_controller.addErrorLog(req.params.userId, 'Error saat request update data user: ' + error.message)

        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

//Get user logs
router.get('/logs/:userId', verifyUser, adminOrAuditorOnly, async (req, res) => {
    try {
        const userId = req.params.userId
        const logs = await users_controller.getUserLogs(userId)

        // Kirim file sebagai respons JSON
        res.status(200).json({
            status: 200,
            logs,
        })
    } catch (error) {
        await error_log_controller.addErrorLog(req.params.userId, 'Error saat mengambil logs user: ' + error.message)
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

//Get user histories
router.get('/histories/:userId', verifyUser, adminOrAuditorOnly, async (req, res) => {
    try {
        const userId = req.params.userId
        const histories = await users_controller.getUserHistories(userId)

        // Kirim file sebagai respons JSON
        res.status(200).json({
            status: 200,
            histories,
        })
    } catch (error) {
        await error_log_controller.addErrorLog(req.params.userId, 'Error saat mengambil histories user: ' + error.message)
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

module.exports = router
