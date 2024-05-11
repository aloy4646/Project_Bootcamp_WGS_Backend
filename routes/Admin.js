const express = require('express')
const router = express.Router()
const users_controller = require('../controller/users_controller')

// accept update request from user
router.put('/:id', async (req, res) => {
    try {
        const adminId = req.params.id
        const update_waitId = req.body.update_waitId

        const update_wait = await users_controller.getUpdateWait(update_waitId)
        console.log({ update_wait })

        const arrayNamaKolom = Object.keys(update_wait.new)
        const arrayValue = Object.values(update_wait.new)

        console.log('type arrayNamaKolom:', typeof arrayNamaKolom)
        console.log('type arrayValue:', typeof arrayValue)

        const stringQuery = arrayNamaKolom
            .map((element, index) => {
                return `${element} = '${arrayValue[index]}'`
            })
            .join(', ')

        console.log('stringQuery: ', stringQuery)

        const acceptResult = await users_controller.acceptUpdateRequest(
            update_wait,
            adminId,
            stringQuery,
            arrayValue
        )

        if (!acceptResult) {
            throw new Error('Error accepting user update request')
        }

        res.json({
            status: 200,
            message: `update request ${update_waitId} accepted`,
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
