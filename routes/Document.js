const express = require('express')
const router = express.Router()
const fs = require('fs')
// const mime = require('mime-types')
const { pdfUploads, sertifikatUploads } = require('../storage/storage')
const {
    users_controller,
    sertifikat_controller,
} = require('../controller/index')

// update request from user (dokumen)
router.put(
    '/:userId',
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
            const userId = req.params.userId
            const message = req.body.message

            var arrayValue = []
            var arrayKolomDiisi = []

            const listKolom = [
                'ktp',
                'npwp',
                'ijazah',
                'transkrip_nilai',
                'cv_pribadi',
                'cv_perusahaan',
            ]

            for (const field of listKolom) {
                if (req.files && req.files[field]) {
                    arrayValue.push(req.files[field][0].path)
                    arrayKolomDiisi.push(field)
                }
            }

            var oldData = await users_controller.getUserData(
                arrayKolomDiisi,
                userId
            )

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
            // hasilnya menjadi seperti ini {"ktp": "...", "npwp": "...", dst}
            const oldDataArray = oldDataCleaned.split(',')
            const oldDataJSON = {}
            arrayKolomDiisi.forEach((kolom, index) => {
                oldDataJSON[kolom] = oldDataArray[index]
            })

            const newDataJSON = {}
            arrayKolomDiisi.forEach((kolom, index) => {
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

            await error_log_controller.addErrorLog(req.params.userId, 'Error requesting update document')

            res.status(500)
            res.json({
                status: 500,
                message: 'Internal Server Error',
                error: error,
            })
        }
    }
)

// get user sertifikat list
router.get('/sertifikat/:userId', async (req, res) => {
    try {
        const userId = req.params.userId

        const listSertifikat = await sertifikat_controller.getUserSertifikat(
            userId
        )

        if (!listSertifikat) {
            throw new Error('Error getting user sertifikat list')
        }

        res.json({ status: 200, listSertifikat })
    } catch (error) {
        await error_log_controller.addErrorLog(req.params.userId, 'Error getting user certificate list')
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

//get user sertifikat detail
router.get('/sertifikat/:userId/:sertifikatId', async (req, res) => {
    try {
        const userId = req.params.userId
        const sertifikatId = req.params.sertifikatId

        const sertifikat = await sertifikat_controller.getDetailSertifikat(
            userId,
            sertifikatId
        )

        if (!sertifikat) {
            throw new Error('Error getting user sertifikat list')
        }

        res.json({ status: 200, sertifikat })
    } catch (error) {
        await error_log_controller.addErrorLog(req.params.userId, 'Error getting user certificate detail')
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

// Add sertifikat
router.post(
    '/sertifikat',
    sertifikatUploads.single('media'),
    async (req, res) => {
        try {
            const userId = req.body.userId

            var arrayKolom = []
            var arrayValue = []

            const propertiesToCheck = [
                'nama',
                'organisasi_penerbit',
                'tanggal_terbit',
                'tanggal_expired',
                'credential_id',
                'credential_url',
            ]

            propertiesToCheck.forEach((property) => {
                if (req.body[property]) {
                    arrayValue.push(req.body[property])
                    arrayKolom.push(property)
                }
            })

            //cek apakah ada file media pada request
            if (req.file && req.file.path) {
                arrayValue.push(req.file.path)
                arrayKolom.push('media')
            }

            const newSertifikat = {}
            arrayKolom.forEach((kolom, index) => {
                newSertifikat[kolom] = arrayValue[index]
            })

            const result = await sertifikat_controller.addSertifikat(
                userId,
                newSertifikat
            )

            if (!result) {
                throw new Error('Error adding sertifikat')
            }

            res.json({ status: 200, message: 'sertifikat added' })
        } catch (error) {
            await error_log_controller.addErrorLog(req.body.userId, 'Error creating user certificate')
            res.status(500)
            res.json({
                status: 500,
                message: 'Internal Server Error',
                error: error,
            })
        }
    }
)

//Update sertifikat
router.put(
    '/sertifikat/:sertifikatId',
    sertifikatUploads.single('media'),
    async (req, res) => {
        try {
            const sertifikatId = req.params.sertifikatId
            const userId = req.body.userId

            console.log({ userId: userId, sertifikatId: sertifikatId })

            var arrayKolom = []
            var arrayValue = []

            const propertiesToCheck = [
                'nama',
                'organisasi_penerbit',
                'tanggal_terbit',
                'tanggal_expired',
                'credential_id',
                'credential_url',
            ]

            propertiesToCheck.forEach((property) => {
                if (req.body[property]) {
                    arrayValue.push(req.body[property])
                    arrayKolom.push(property)
                }
            })

            //cek apakah ada file media pada request
            if (req.file && req.file.path) {
                arrayValue.push(req.file.path)
                arrayKolom.push('media')
            }

            const stringQuery = arrayKolom
                .map((element, index) => {
                    return `${element} = '${arrayValue[index]}'`
                })
                .join(', ')

            console.log({ stringQuery })

            const result = await sertifikat_controller.updateSertifikat(
                userId,
                sertifikatId,
                stringQuery
            )

            if (!result) {
                throw new Error('Error updating user document')
            }

            res.json({ status: 200, message: 'update success' })
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

            await error_log_controller.addErrorLog(req.body.userId, 'Error creating user certificate')

            res.status(500)
            res.json({
                status: 500,
                message: 'Internal Server Error',
                error: error,
            })
        }
    }
)


router.put('/sertifikat/:sertifikatId/delete', async (req, res) => {
    try {
        const sertifikatId = req.params.sertifikatId
        const userId = req.body.userId

        const result = await sertifikat_controller.deleteSertifikat(userId, sertifikatId)

        if (!result) {
            throw new Error('Error deleting sertifikat')
        }

        res.json({ status: 200, message: 'sertifikat deleted' })
    } catch (error) {
        await error_log_controller.addErrorLog(req.body.userId, 'Error deleting user certificate')
        res.status(500)
            res.json({
                status: 500,
                message: 'Internal Server Error',
                error: error,
            })
    }
})

module.exports = router
