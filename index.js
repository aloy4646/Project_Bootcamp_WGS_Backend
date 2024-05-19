const express = require('express')
const morgan = require('morgan')
const cors = require("cors")

const bodyParser = require('body-parser')

const app = express()

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(cors({
    credentials: true,
    origin: "http://localhost:3000",
}))

app.use(morgan("dev"))

app.use(express.static('public'))

const routes = require("./routes/index")
app.use("/users", routes.usersRouter)
app.use("/users/documents", routes.documentsRouter)
app.use("/admin", routes.adminRouter)
app.use("/file", routes.fileDownloadRouter)


app.use('/', (req, res) => {
    res.status(404)
    res.send('page not found : 404')
})

app.listen(3001 , () => 
    console.log("Server running on port 3001"
))
