
// Farza Nurifan

// Import
var bodyParser = require('body-parser')
var methodOverride = require('method-override')
var express = require('express')
var partials = require('express-partials')
var fs = require('fs')
var cookieParser = require('cookie-parser')

var multipart = require('connect-multiparty')
var multipartMiddleware = multipart({ uploadDir: './data' })

var vroute = require('./route/route_view')
var api = require('./route/api')
var auth = require('./function/auth')
var file = require('./function/file')
var dir = require('./function/dir')

// Express config
var app = express()
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
app.listen(3000, () => console.log('listening on 3000'))


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
app.post('/web/api/login', api.login)
app.post('/web/api/register', api.register)
app.post('/web/api/upload', api.upload)
app.get('/web/api/download/:filename', api.download)
app.put('/web/api/update/:filename', api.update)
app.delete('/web/api/delete/:filename', api.delete)
app.delete('/web/api/rmdir/:dir', api.rmdir)

// API //
// Auth
app.post('/api/register', auth.register)
app.post('/api/login', auth.login)

// File
app.post('/api/upload', multipartMiddleware, file.upload)
app.post('/api/download', file.download)
app.post('/api/delete', file.delete)
app.post('/api/rename', file.rename)
app.post('/api/list', file.list)
app.post('/api/movefile', file.movefile)

// Dir
app.post('/api/mkdir', dir.mkdir)
app.post('/api/rmdir', dir.rmdir)
app.post('/api/listdir', dir.listdir)
app.post('/api/movedir', dir.movedir)
app.post('/api/sizedir', dir.sizedir)



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