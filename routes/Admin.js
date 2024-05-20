const express = require('express')
const router = express.Router()
const { users_controller, update_controller, error_log_controller } = require('../controller/index')
const { verifyUser, adminOnly } = require('../middleware/AuthUser')
const { generateRandomString } = require('../password_generator/generator')
const bcrypt = require('bcrypt')

// Accept update request from user
router.put('/update-request/accept/:update_requestId', verifyUser, adminOnly, async (req, res) => {
    try {
        const update_requestId = req.params.update_requestId
        const idAdmin = req.body.idAdmin

        const update_request = await update_controller.getUpdateRequest(
            update_requestId
        )

        console.log({update_request});

        const arrayNamaKolom = Object.keys(update_request.new)
        const arrayValue = Object.values(update_request.new)

        const stringQuery = arrayNamaKolom
            .map((element, index) => {
                return `${element} = '${arrayValue[index]}'`
            })
            .join(', ')

        const acceptResult = await update_controller.acceptUpdateRequest(
            update_request,
            idAdmin,
            stringQuery,
            arrayValue
        )

        if (!acceptResult) {
            throw new Error('Error saat menerima request update')
        }

        res.json({
            status: 200,
            message: `Request update ${update_requestId} berhasil diterima`,
        })
    } catch (error) {
        await error_log_controller.addErrorLog(req.body.idAdmin, 'Error saat accept update document user: ' + error.message)
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

//Reject update request from user
router.put('/update-request/reject/:update_requestId', verifyUser, adminOnly, async (req, res) => {
    try {
        const update_requestId = req.params.update_requestId
        const { idAdmin, alasan } = req.body

        const update_request = await update_controller.getUpdateRequest(
            update_requestId
        )

        const rejectResult = await update_controller.rejectUpdateRequest(
            update_requestId,
            idAdmin,
            update_request.idUser,
            alasan
        )

        if (!rejectResult) {
            throw new Error('Error saat menolak request update')
        }

        res.json({
            status: 200,
            message: `Request update ${update_requestId} berhasil ditolak`,
        })
    } catch (error) {

        await error_log_controller.addErrorLog(req.body.idAdmin, 'Error saat request update document user: ' + error.message)
        
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

//Get list update request yang belum di-accept
router.get('/update-request', verifyUser, adminOnly, async (req, res) => {
    try {
        const update_requests = await update_controller.getUpdateRequests()

        res.json({ status: 200, update_requests })
    } catch (error) {
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

//get update-request detail
router.get('/update-request/:update_requestId', verifyUser, adminOnly, async (req, res) => {
    try {
        const update_requestId = req.params.update_requestId
        const update_request = await update_controller.getUpdateRequest(update_requestId)

        res.json({ status: 200, update_request })
    } catch (error) {
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

//Update Password by admin
router.put('/password/:userId', verifyUser, adminOnly, async (req, res) => {
    try {
        const userId = req.params.userId
        const idAdmin = req.userId

        const new_password = generateRandomString(6, 10)

        const message = "Update password by admin"

        const hash = await bcrypt.hash(new_password, 10)

        const result = await users_controller.updateUserPasswordByAdmin(userId, idAdmin, hash, message)
        console.log("masuk sini3");

        if (!result) {
            throw new Error('Error saat merubah password user by admin')
        }

        console.log("masuk sini 4");

        return res.json({ status: 200, message: 'Password berhasil diubah oleh admin', data: {new_password} })
    } catch (error) {
        await error_log_controller.addErrorLog(req.userId, 'Error saat merubah password user by admin: ' + error.message)
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})


module.exports = router
