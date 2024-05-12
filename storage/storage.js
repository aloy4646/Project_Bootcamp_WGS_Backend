const multer = require('multer')
const path = require('path')


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

// Konfigurasi upload untuk Sertufikat
const sertifikatUploads = createUploadConfig('../public/sertifikatUploads', [
    '.png',
    '.jpg',
    '.jpeg',
    '.pdf'
])

module.exports = {
    imageUploads,
    pdfUploads,
    sertifikatUploads
}