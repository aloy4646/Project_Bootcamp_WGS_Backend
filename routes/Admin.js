const express = require('express')
const router = express.Router()
const { admin_controller } = require('../controller/index')

// accept update request from user
router.put('/update/accept/:update_requestId', async (req, res) => {
    try {
        const update_requestId = req.params.update_requestId
        const idAdmin = req.body.idAdmin

        const update_request = await admin_controller.getUpdateRequest(update_requestId)

        const arrayNamaKolom = Object.keys(update_request.new)
        const arrayValue = Object.values(update_request.new)

        console.log('type arrayNamaKolom:', typeof arrayNamaKolom)
        console.log('type arrayValue:', typeof arrayValue)

        const stringQuery = arrayNamaKolom
            .map((element, index) => {
                return `${element} = '${arrayValue[index]}'`
            })
            .join(', ')

        console.log('stringQuery: ', stringQuery)

        const acceptResult = await admin_controller.acceptUpdateRequest(
            update_request,
            idAdmin,
            stringQuery,
            arrayValue
        )

        if (!acceptResult) {
            throw new Error('Error accepting user update request')
        }

        res.json({
            status: 200,
            message: `update request ${update_requestId} accepted`,
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

//reject update request from user
router.put('/update/reject/:update_requestId', async (req, res) => {
    try {
        const update_requestId = req.params.update_requestId
        const { idAdmin, alasan } = req.body

        const update_request = await admin_controller.getUpdateRequest(update_requestId)

        const rejectResult = await admin_controller.rejectUpdateRequest(
            update_requestId, 
            idAdmin, 
            update_request.idUser, 
            alasan
        )

        if (!rejectResult) {
            throw new Error('Error accepting user update request')
        }

        res.json({
            status: 200,
            message: `update request ${update_requestId} accepted`,
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


//get list update request yang belum di-accept
router.get('/update/', async (req, res) => {
    try {
        const update_requests = await admin_controller.getUpdateRequests()

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

module.exports = router
