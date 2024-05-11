const express = require('express')
const router = express.Router()
const fs = require('fs')
const mime = require('mime-types')
const { imageUploads, pdfUploads } = require('../storage/storage')
const users_controller = require('../controller/users_controller')

router.put('/photo/:id', imageUploads.single('image'), async (req, res) => {
    try {
        const userId = req.params.id
        const { message, idAdmin } = req.body
        const filePath = req.file.path

        await users_controller.updateUserPhoto(
            userId,
            idAdmin,
            filePath,
            message
        )

        res.json({ status: 200, message: 'image received' })
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

        if (!filePath) {
            res.status(404)
            res.json({
                status: 404,
                message: 'Photo not found',
            })
            return
        }

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
        const { message, idAdmin } = req.body
        const filePath = req.file.path

        await users_controller.updateUserIjazah(
            userId,
            idAdmin,
            filePath,
            message
        )

        res.json({ status: 200, message: 'ijazah received' })
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

        if (!filePath) {
            res.status(404)
            res.json({
                status: 404,
                message: 'Ijazah not found',
            })
            return
        }

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

// update request from user (dokumen)
router.put(
    '/:id',
    pdfUploads.fields([
        { name: 'ktp', maxCount: 1 },
        { name: 'npwp', maxCount: 1 },
        { name: 'ijazah', maxCount: 1 },
        { name: 'transkrip_nilai', maxCount: 1 },
        { name: 'cv_pribadi', maxCount: 1 },
        { name: 'cv_perusahaan', maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const userId = req.params.id
            const message = req.body.message

            var arrayValue = []
            var arrayNamaKolom = []

            if (req.files && req.files.ktp) {
                arrayValue.push(req.files.ktp[0].path)
                arrayNamaKolom.push('ktp')
            }

            if (req.files && req.files.npwp) {
                arrayValue.push(req.files.npwp[0].path)
                arrayNamaKolom.push('npwp')
            }

            if (req.files && req.files.ijazah) {
                arrayValue.push(req.files.ijazah[0].path)
                arrayNamaKolom.push('ijazah')
            }

            if (req.files && req.files.transkrip_nilai) {
                arrayValue.push(req.files.transkrip_nilai[0].path)
                arrayNamaKolom.push('transkrip_nilai')
            }

            if (req.files && req.files.cv_pribadi) {
                arrayValue.push(req.files.cv_pribadi[0].path)
                arrayNamaKolom.push('cv_pribadi')
            }

            if (req.files && req.files.cv_perusahaan) {
                arrayValue.push(req.files.cv_perusahaan[0].path)
                arrayNamaKolom.push('cv_perusahaan')
            }

            var oldData = await users_controller.getUserData(
                arrayNamaKolom,
                userId
            )

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
            // hasilnya menjadi seperti ini {"ktp": "...", "npwp": "...", dst}
            const oldDataArray = oldDataCleaned.split(',')
            const oldDataJSON = {}
            arrayNamaKolom.forEach((kolom, index) => {
                oldDataJSON[kolom] = oldDataArray[index]
            })

            const newDataJSON = {}
            arrayNamaKolom.forEach((kolom, index) => {
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
            //menghapus file jika terjadi kesalahan
            if (req.files) {
                Object.values(req.files).forEach((files) => {
                    files.forEach((file) => {
                        fs.unlink(file.path, (err) => {
                            if (err) {
                                console.error('Gagal menghapus file:', err)
                                return
                            }
                            console.log('File berhasil dihapus:', file.path)
                        })
                    })
                })
            }

            res.status(500)
            res.json({
                status: 500,
                message: 'Internal Server Error',
                error: error,
            })
        }
    }
)

module.exports = router
