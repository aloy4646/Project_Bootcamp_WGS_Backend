const express = require('express')
const router = express.Router()
const fs = require('fs')
// const mime = require('mime-types')
const { pdfUploads, sertifikatUploads } = require('../storage/storage')
const { users_controller, sertifikat_controller } = require('../controller/index')


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
            var arrayKolomDiisi = []

            const listKolom = ['ktp', 'npwp', 'ijazah', 'transkrip_nilai', 'cv_pribadi', 'cv_perusahaan']
            
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

            res.status(500)
            res.json({
                status: 500,
                message: 'Internal Server Error',
                error: error,
            })
        }
    }
)


//Add sertifikat
// router.post('/sertifikat/:id', sertifikatUploads.single('media'), async (req, res) => {
//     try {
        
//     } catch (error) {
//         res.status(500)
//             res.json({
//                 status: 500,
//                 message: 'Internal Server Error',
//                 error: error,
//             })
//     }
// })







module.exports = router
