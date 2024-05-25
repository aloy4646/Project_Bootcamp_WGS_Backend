const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const { pdfUploads, sertifikatUploads } = require('../storage/storage')
const {users_controller, sertifikat_controller, error_log_controller } = require('../controller/index')
const { verifyUser } = require('../middleware/AuthUser')

// Request Update User Data (dokumen)
router.put(
    '/:userId',
    verifyUser,
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

            if(userId != req.userId && req.role !== 'ADMIN') {
                res.status(403)
                res.json({ status: 403, error: 'User tidak memiliki akses' })
                return
            }

            const oldDataChanged = req.body.oldDataChanged

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
                    const relativePath = path.relative(
                        path.join(__dirname, 'storage'),
                        req.files[field][0].path
                    )
                    arrayValue.push(relativePath)
                    arrayKolomDiisi.push(field)
                }
            }

            const newDataJSON = {}
            arrayKolomDiisi.forEach((kolom, index) => {
                newDataJSON[kolom] = arrayValue[index]
            })

            const result = await users_controller.requestUpdate(
                userId,
                req.userId,
                message,
                oldDataChanged,
                newDataJSON
            )

            if (!result) {
                throw new Error('Error saat request update dokumen user')
            }

            res.json({ status: 200, message: 'Request update berhasil tersimpan, silahkan tunggu konfirmasi dari admin' })
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

            await error_log_controller.addErrorLog(req.params.userId, 'Error saat request update document user: ' + error.message)

            res.status(500)
            res.json({
                status: 500,
                message: 'Internal Server Error',
                error: error,
            })
        }
    }
)

// Get list sertifikat user
router.get('/sertifikat/:userId', verifyUser, async (req, res) => {
    try {
        const userId = req.params.userId

        if(userId != req.userId && req.role !== 'ADMIN' && req.role !== 'AUDITOR') {
            res.status(403)
            res.json({ status: 403, error: 'User tidak memiliki akses' })
            return
        }

        const listSertifikat = await sertifikat_controller.getUserSertifikat(
            userId
        )

        if (!listSertifikat) {
            throw new Error('Error saat mengambil list sertifikat user')
        }

        res.json({ status: 200, listSertifikat })
    } catch (error) {
        await error_log_controller.addErrorLog(req.params.userId, 'Error saat mengambil list sertifikat user: ' + error.message)
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

//get user sertifikat detail
router.get('/sertifikat/:userId/:sertifikatId', verifyUser, async (req, res) => {
    try {
        const userId = req.params.userId
        const sertifikatId = req.params.sertifikatId

        if(userId != req.userId && req.role !== 'ADMIN' && req.role !== 'AUDITOR') {
            res.status(403)
            res.json({ status: 403, error: 'User tidak memiliki akses' })
            return
        }

        const sertifikat = await sertifikat_controller.getDetailSertifikat(
            userId,
            sertifikatId
        )

        if (!sertifikat) {
            throw new Error('Error saat mengambil detail sertifikat user')
        }

        res.json({ status: 200, sertifikat })
    } catch (error) {
        await error_log_controller.addErrorLog(req.params.userId, 'Error saat mengambil detail sertifikat user: ' + error.message)
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
    verifyUser,
    sertifikatUploads.single('media'),
    async (req, res) => {
        try {
            const userId = req.body.userId

            if(userId != req.userId){
                res.status(403)
                res.json({ status: 403, error: 'User tidak memiliki akses' })
                return
            }

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
                const relativePath = path.relative(
                    path.join(__dirname, 'storage'),
                    req.file.path
                )
                arrayValue.push(relativePath)
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
                throw new Error('Error saat menambah sertifikat')
            }

            res.json({ status: 200, message: 'Sertifikat berhasil ditambahkan' })
        } catch (error) {
            await error_log_controller.addErrorLog(req.body.userId, 'Error saat menambah sertifikat: ' + error.message)
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
    verifyUser,
    sertifikatUploads.single('media'),
    async (req, res) => {
        try {
            const sertifikatId = req.params.sertifikatId
            const userId = req.body.userId

            if(userId != req.userId){
                res.status(403)
                res.json({ status: 403, error: 'User tidak memiliki akses' })
                return
            }

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
                const relativePath = path.relative(
                    path.join(__dirname, 'storage'),
                    req.file.path
                )
                arrayValue.push(relativePath)
                arrayKolom.push('media')
            }

            const stringQuery = arrayKolom
                .map((element, index) => {
                    return `${element} = '${arrayValue[index]}'`
                })
                .join(', ')

            const result = await sertifikat_controller.updateSertifikat(
                userId,
                sertifikatId,
                stringQuery
            )

            if (!result) {
                throw new Error('Error saat mengubah sertifikat user')
            }

            res.json({ status: 200, message: 'Sertifikat berhasil diubah' })
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

            await error_log_controller.addErrorLog(req.body.userId, 'Error saat mengubah sertifikat user: ' + error.message)

            res.status(500)
            res.json({
                status: 500,
                message: 'Internal Server Error',
                error: error,
            })
        }
    }
)

//Delete sertifikat
router.delete('/sertifikat/:sertifikatId', verifyUser, async (req, res) => {
    try {
        const sertifikatId = req.params.sertifikatId
        const userId = req.userId

        const sertifikat = await sertifikat_controller.getSertifikatBySertifikatId(
            sertifikatId
        )

        if (!sertifikat) {
            throw new Error('Error saat menghapus sertifikat')
        }

        if(sertifikat.idUser != req.userId){
            res.status(403)
            res.json({ status: 403, error: 'User tidak memiliki akses' })
            return
        }

        const result = await sertifikat_controller.deleteSertifikat(userId, sertifikatId)

        if (!result) {
            throw new Error('Error saat menghapus sertifikat')
        }

        res.json({ status: 200, message: 'Sertifikat berhasil dihapus' })
    } catch (error) {
        await error_log_controller.addErrorLog(req.body.userId, 'Error saat menghapus sertifikat: ' + error.message)
        res.status(500)
            res.json({
                status: 500,
                message: 'Internal Server Error',
                error: error,
            })
    }
})

module.exports = router
