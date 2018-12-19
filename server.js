
// Farza Nurifan

// Import
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const express = require('express')
const partials = require('express-partials')
const fs = require('fs')
const cookieParser = require('cookie-parser')

const vroute = require('./route/route_view')
const api = require('./route/api')

// Express config
const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(methodOverride('_method'))
app.set('view engine', 'ejs')
app.use(partials())
app.use(cookieParser())
app.use(express.static(__dirname + '/data'))

if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
}

// Start listening on localhost:3000
app.listen(3001, () => console.log('listening on 3001'))


// Routing //
app.get('/login', vroute.login)
app.get('/logout', vroute.logout)
app.get('/register', vroute.register)
app.get('/', vroute.home)
app.get('/page/:page', vroute.index)
app.get('/add', vroute.add)
app.get('/edit/:filename', vroute.edit)
app.get('/view/:filename', vroute.view)

// API
app.post('/api/login', api.login)
app.post('/api/register', api.register)
app.post('/api/upload', api.upload)
app.get('/api/download/:filename', api.download)
app.put('/api/update/:filename', api.update)
app.delete('/api/delete/:filename', api.delete)


// app.get('/premium', (req, res) => {
//     var id = ObjectId(req.cookies.cloud_id)
//     db.collection(table).find(id).toArray((err, results) => {
//         if (results) {
//             var premium = true
//             var update = { premium }

//             db.collection(table).updateOne({ _id: id }, { $set: update }, (err, result) => {
//                 logError(err)
//                 res.clearCookie('cloud_premium')
//                 res.cookie('cloud_premium', premium, options)
//                 res.redirect('/')
//             })
//         }
//     })
// })