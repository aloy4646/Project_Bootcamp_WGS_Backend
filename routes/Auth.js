const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const { users_controller } = require('../controller/index')

//Log In
router.post('/login', async (req, res) => {
    try {
        const { email_kantor, password } = req.body

        const user = await users_controller.findUserByEmailKantor(email_kantor)

        if (!user) {
            res.status(400)
            res.json({ status: 'failed', error: 'Email kantor atau password salah' })
            return
        }

        const match = await bcrypt.compare(password, user.password)
        if (!match) {
            return res.status(400).json({
                status: 'failed',
                error: 'Email kantor atau password salah',
            })
        }

        req.session.userId = user.id

        const id = user.id
        const role = user.role

        res.json({ status: 'success', message: 'Login berhasil', data: {id, email_kantor, role}})
    } catch (error) {
        res.status(500)
        res.json({
            status: 'failed',
            message: 'Internal Server Error',
            error: error,
        })
    }
})

//Log Out
router.delete('/logout', async (req, res) => {
    try {
        req.session.destroy((error) => {
            if(error){
                throw error
            }else{
                res.json({ status: 'success', message: 'Logout berhasil'})
            }
        })
    } catch (error) {
        res.status(500)
        res.json({
            status: 'failed',
            message: 'Internal Server Error',
            error: error,
        })
    }
})

//Check Session
router.get('/check', async (req, res) => {
    try {
        if(!req.session.userId){
            return res.status(401).json({
                status: 'failed',
                error: 'Session tidak ada, mohon login ke akun anda',
            })
        }

        const user = await users_controller.findUserById(req.session.userId)

        if (!user) {
            res.status(404)
            res.json({ status: 404, error: 'User tidak ditemukan' })
            return
        }

        const id = user.id
        const email_kantor = user.email_kantor
        const role = user.role

        res.json({ status: 'success', message: 'User berhasil ditemukan', data: {id, email_kantor, role}})

    } catch (error) {
        res.status(500)
        res.json({
            status: 'failed',
            message: 'Internal Server Error',
            error: error,
        })
    }
})

module.exports = router