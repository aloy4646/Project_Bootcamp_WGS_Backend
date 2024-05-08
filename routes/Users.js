const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const users_controller = require('../controller/users_controller')

router.post('/', async (req, res) => {
    try {
        const { email, password } = req.body

        bcrypt.hash(password, 10).then(async (hash) => {
            await users_controller.createUser({ email, password: hash })

            res.json({ status: 200, message: 'registration success' })
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
router.get('/', async (req, res) => {
    try {
        const contacts = await users_controller.getUsers()
        // res.json(contacts)
        res.json({ status: 200, contacts: contacts })
    } catch (error) {
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
        const { email, password } = req.body

        const user = await users_controller.findUser(email)

        if (!user) {
            res.status(404)
            res.json({ status:404, error: 'user does not exist' })
            return
        }

        bcrypt.compare(password, user.password).then((match) => {
            if (!match) {
                res.status(404)
                res.json({ status:404, error: 'wrong email and password combination' })
                return
            }

            // res.json({success:"login success"})
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

module.exports = router
