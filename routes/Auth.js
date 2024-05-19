const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const { users_controller, error_log_controller } = require('../controller/index')

//login
router.post('/login', async (req, res) => {
    try {
        const { email_kantor, password } = req.body

        const user = await users_controller.findUserByEmailKantor(email_kantor)

        if (!user) {
            res.status(400)
            res.json({ status: 400, error: 'Email kantor atau password salah' })
            return
        }

        const match = await bcrypt.compare(password, user.password)
        if (!match) {
            return res.status(400).json({
                status: 400,
                error: 'Email kantor atau password salah',
            })
        }

        req.session.userId = user.id

        const id = user.id
        const role = user.role

        res.json({ status: 200, message: 'login success', data: {id, email_kantor, role}})
    } catch (error) {
        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})

//logout
router.delete('/logout', async (req, res) => {
    try {
        req.session.destroy((error) => {
            if(error){
                throw error
            }else{
                res.json({ status: 200, message: 'Logout berhasil'})
            }
        })
    } catch (error) {
        // await error_log_controller.addErrorLog(req.params.userId, 'Error logout: ' + error.message)

        res.status(500)
        res.json({
            status: 500,
            message: 'Internal Server Error',
            error: error,
        })
    }
})


router.get('/check', async (req, res) => {
    try {
        if(!req.session.userId){
            return res.status(401).json({
                status: 401,
                error: 'Session tidak ada, mohon login ke akun anda',
            })
        }

        const user = await users_controller.findUserById(req.session.userId)

        if (!user) {
            res.status(404)
            res.json({ status: 404, error: 'user not found' })
            return
        }

        const id = user.id
        const email_kantor = user.email_kantor
        const role = user.role

        res.json({ status: 200, message: 'User ditemukan', data: {id, email_kantor, role}})

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