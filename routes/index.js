const usersRouter = require('./Users')
const adminRouter = require('./Admin')
const documentsRouter = require('./Document')
const fileDownloadRouter = require('./FileDownload')
const authRouter = require('./Auth')

module.exports = {
    usersRouter,
    adminRouter,
    documentsRouter,
    fileDownloadRouter,
    authRouter,
}
