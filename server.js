
// Farza Nurifan

// Import
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const express = require('express')
const partials = require('express-partials')
const MongoClient = require('mongodb').MongoClient
const multer = require('multer')
const fs = require('fs')
const ip = require('ip')
const getSize = require('get-folder-size')
const passwordHash = require('password-hash')
const request = require('request')
const cookieParser = require('cookie-parser')
const ObjectId = require('mongodb').ObjectID

// MongoDB config
var uri = 'mongodb+srv://farzanurifan:bismillah@bdt-6ij3v.mongodb.net/test'
var database = 'cloud'
var table = 'myGallery'

// EJS view variables
const pageItem = 10 // Items per page on table
const fields = ['filename', 'size']

// Log
const logError = (err) => { if (err) return console.log(err) }

// Express config
const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(methodOverride('_method'))
app.set('view engine', 'ejs')
app.use(partials())
app.use(cookieParser())
app.use(express.static(__dirname + '/data'))

// Storage config
var Storage = multer.diskStorage({
    destination: (req, file, callback) => {
        var dir = req.cookies.cloud_dir
        callback(null, dir)
    },
    filename: (req, file, callback) => {
        callback(null, file.originalname)
    }
})

if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
}

// Cookies config
var options = {
    maxAge: 1000 * 60 * 1, // would expire after 15 minutes
}

// Database connection
var db
MongoClient.connect(uri, { useNewUrlParser: true, }, (err, client) => {
    logError(err)
    db = client.db(database)
})

// Table pagination settings
const pagination = (results, page) => {
    var pages = Math.ceil(results / pageItem)
    let first = 2
    let last = 9
    if (pages <= 11) {
        last = pages - 1
    }
    else if (page > 6 && !(page > pages - 6)) {
        first = page - 3
        last = page + 3
    }
    else if (page > pages - 6) {
        first = pages - 8
        last = pages - 1
    }
    return { pages, first, last }
}

// Start listening on localhost:3000
app.listen(3001, () => console.log('listening on 3001'))


// Routing //
app.get('/login', (req, res) => {
    if (req.cookies.cloud_login) return res.redirect('/')
    res.render('login.ejs', { loggedInStatus: 'Not logged in' })
})

app.get('/logout', (req, res) => {
    res.clearCookie('cloud_login')
    res.clearCookie('cloud_dir')
    res.clearCookie('cloud_username')
    res.clearCookie('cloud_id')
    res.clearCookie('cloud_premium')
    res.redirect('/')
})

app.get('/register', (req, res) => {
    if (req.cookies.cloud_login) return res.redirect('/')
    console.log(ip.address())
    res.render('register.ejs', { loggedInStatus: 'Not logged in' })
})

app.get('/premium', (req, res) => {
    var id = ObjectId(req.cookies.cloud_id)
    db.collection(table).find(id).toArray((err, results) => {
        if (results) {
            var premium = true
            var update = { premium }

            db.collection(table).updateOne({ _id: id }, { $set: update }, (err, result) => {
                logError(err)
                res.clearCookie('cloud_premium')
                res.cookie('cloud_premium', premium, options)
                res.redirect('/')
            })
        }
    })
})

app.get('/', (req, res) => res.redirect('/page/1'))

app.get('/page/:page', (req, res) => {
    var token = req.cookies.cloud_token
    if (!token) res.redirect('/login')

    var page = Number(req.params.page)
    var dir = ''
    request.post('http://localhost:3000/api/list', {
        form: {
            token,
            dir
        }
    }, (error, response, body) => {
        var data = JSON.parse(body)
        if (data.message == 'Failed to authenticate token.') {
            res.clearCookie('cloud_token')
            res.redirect('/login')
        }
        else {
            var paginate = pagination(data.items.length, page)
            let results = []
            for (let i = 0; i < data.items.length; i++) {
                results[i] = {
                    size: 'dummy',
                    filename: data.items[i]
                }
            }

            res.render('index.ejs', {
                results,
                page,
                first: paginate.first,
                pages: paginate.pages,
                last: paginate.last,
                fields,
                size: 'dummy',
                loggedInStatus: 'dummy',
                premiumButton: 'no'
            })
        }
    })
})

app.get('/add', (req, res) => {
    var token = req.cookies.cloud_token
    if (!token) res.redirect('/login')

    var loggedInStatus = `Logged in as ${req.cookies.cloud_username}`
    res.render('add.ejs', { fields, loggedInStatus })
})

app.get('/download/:filename', (req, res) => {
    var token = req.cookies.cloud_token
    if (!token) res.redirect('/login')

    var dir = req.cookies.cloud_dir
    var filename = req.params.filename
    var file = `${dir}/${filename}`
    res.download(file)
})

app.get('/edit/:filename', (req, res) => {
    var token = req.cookies.cloud_token
    if (!token) res.redirect('/login')

    var filename = req.params.filename
    var loggedInStatus = `Logged in as ${req.cookies.cloud_username}`
    res.render('edit.ejs', { result: { filename }, fields: ['filename'], loggedInStatus })
})

app.get('/view/:filename', (req, res) => {
    var token = req.cookies.cloud_token
    if (!token) res.redirect('/login')

    var idUser = req.cookies.cloud_id
    var filename = req.params.filename
    var extension = filename.toLowerCase().split(".")[1]
    var loggedInStatus = `Logged in as ${req.cookies.cloud_username}`
    res.render('view.ejs', { result: { filename }, fields: ['filename'], loggedInStatus, filename, idUser, extension })
})

// API

app.post('/api/login', (req, res) => {
    var email = req.body.email
    var password = req.body.password

    request.post('http://localhost:3000/api/login', {
        form: {
            email,
            password
        }
    }, (error, response, body) => {
        var data = JSON.parse(body)
        if (data.message == 'OK') {
            res.cookie('cloud_token', data.token)
        }
        res.redirect('/')
    })
})

app.post('/api/register', (req, res) => {
    var name = req.body.name
    var email = req.body.email
    var password = req.body.password

    request.post('http://localhost:3000/api/register', {
        form: {
            name,
            email,
            password
        }
    }, (error, response, body) => {
        res.redirect('/')
    })
})

app.post('/api/upload', (req, res) => {
    var username = req.cookies.cloud_username
    var maxCapacity = 10 * 1024 * 1024
    var premium = req.cookies.cloud_premium
    if (premium == 'true') {
        maxCapacity = maxCapacity * 1024
    }

    request({
        method: 'GET',
        url: `http://127.0.0.1:3000/api/size/${username}`,
        json: true
    }, (error, response) => {
        var size = response.body.size
        var maxSize = maxCapacity - size
        var upload = multer({
            storage: Storage,
            limits: { fileSize: maxSize }
        }).array('fileUploader', 3) // Field name and max count

        upload(req, res, (err) => {
            logError(err)
            res.redirect('/')
        })
    })
})

app.put('/api/update/:filename', (req, res) => {
    var userId = req.cookies.cloud_id
    var filename = req.params.filename
    var newFilename = req.body.filename
    fs.rename(`./data/${userId}/${filename}`, `./data/${userId}/${newFilename}`, (err) => {
        logError(err)
        res.redirect('/')
    })
})

app.delete('/api/delete/:filename', (req, res) => {
    var userId = req.cookies.cloud_id
    var filename = req.params.filename
    fs.unlink(`./data/${userId}/${filename}`, (err) => {
        logError(err)
        res.redirect('/')
    })
})
