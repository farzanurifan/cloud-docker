
// Farza Nurifan

// Import
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const express = require('express')
const partials = require('express-partials')
const MongoClient = require('mongodb').MongoClient
const multer = require('multer')
const fs = require('fs')
const getSize = require('get-folder-size')
const passwordHash = require('password-hash')
const request = require('request')
const cookieParser = require('cookie-parser')

// MongoDB config

const uri = 'mongodb://mongo:27017'
const database = 'cloud'
const table = 'myGallery'

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

if (!fs.existsSync('./data')){
    fs.mkdirSync('./data');
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
app.listen(3000, () => console.log('listening on 3000'))


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
    res.redirect('/')
})

app.get('/register', (req, res) => {
    if (req.cookies.cloud_login) return res.redirect('/')
    res.render('register.ejs', { loggedInStatus: 'Not logged in' })
})

app.get('/', (req, res) => res.redirect('/page/1'))

app.get('/page/:page', (req, res) => {
    if (!req.cookies.cloud_login) res.redirect('/login')
    var dir = req.cookies.cloud_dir
    var loggedInStatus = `Logged in as ${req.cookies.cloud_username}`
    var username = req.cookies.cloud_username
    var page = Number(req.params.page)
    let results = []
    let stats = null
    if (dir) {
        request({
            method: 'GET',
            url: `http://127.0.0.1:3000/api/size/${username}`,
            json: true
        }, (error, response) => {
            var size = (response.body.size / 1024 / 1024).toFixed(2) + ' MB'

            fs.readdir(dir, (err, files) => {
                for (let i = 0; i < files.length; i++) {
                    stats = fs.statSync(`${dir}/${files[i]}`)
                    results[i] = {
                        size: stats['size'],
                        filename: files[i]
                    }
                }
                var paginate = pagination(files.length, page)
                res.render('index.ejs', {
                    results,
                    page,
                    first: paginate.first,
                    pages: paginate.pages,
                    last: paginate.last,
                    fields,
                    size,
                    loggedInStatus
                })
            })
        })
    }
})

app.get('/add', (req, res) => {
    if (!req.cookies.cloud_login) res.redirect('/login')
    var loggedInStatus = `Logged in as ${req.cookies.cloud_username}`
    res.render('add.ejs', { fields, loggedInStatus })
})

app.get('/download/:filename', (req, res) => {
    if (!req.cookies.cloud_login) res.redirect('/login')
    var dir = req.cookies.cloud_dir
    var filename = req.params.filename
//    console.log(`${filename} downloaded`)
    var file = `${dir}/${filename}`
    res.download(file)
})

app.get('/edit/:filename', (req, res) => {
    if (!req.cookies.cloud_login) res.redirect('/login')
    var filename = req.params.filename
    var loggedInStatus = `Logged in as ${req.cookies.cloud_username}`
    res.render('edit.ejs', { result: { filename }, fields: ['filename'], loggedInStatus })
})

app.get('/view/:filename', (req, res) => {
    if (!req.cookies.cloud_login) res.redirect('/login')
    var idUser = req.cookies.cloud_id
    var filename = req.params.filename
    var loggedInStatus = `Logged in as ${req.cookies.cloud_username}`
    res.render('view.ejs', { result: { filename }, fields: ['filename'], loggedInStatus, filename, idUser })
})

// API

app.post('/api/login', (req, res) => {
    var email = req.body.email
    var password = req.body.password

    db.collection(table).find({ email }).toArray((err, results) => {
        result = results[0]
        if (!result) return res.redirect('/')

        let options = {
            maxAge: 1000 * 60 * 1, // would expire after 15 minutes
        }

        var loggedIn = passwordHash.verify(password, result.password)
        if (loggedIn) {
            var username = result.name.replace(/\s+/g, '%20')
            loggedInStatus = `Logged in as ${result.name}`
            dir = `./data/${result._id}`
//            console.log(`logged in as ${result.name}`)
            res.cookie('cloud_login', true, options)
            res.cookie('cloud_dir', dir, options)
            res.cookie('cloud_username', result.name, options)
            res.cookie('cloud_id', result._id, options)
        }
        else console.log('failed to log in')
        res.redirect('/')
    })
})

app.post('/api/register', (req, res) => {
    var name = req.body.name
    var email = req.body.email
    var password = passwordHash.generate(req.body.password)
    var data = { name, email, password, premium: false }
    db.collection(table).save(data, (err, result) => {
        logError(err)
        dir = `./data/${result.ops[0]._id}`
        fs.mkdirSync(dir)
        console.log('saved to database')
        res.redirect('/')
    })
})

app.get('/api/size/:name', (req, res) => {
    var name = req.params.name
    db.collection(table).find({ name }).toArray((err, results) => {
        result = results[0]
        getSize(`./data/${result._id}`, (err, folderSize) => {
            logError(err)
            var size = folderSize
            res.json({ size })
        })
    })
})

app.post('/api/upload', (req, res) => {
    var username = req.cookies.cloud_username
    request({
        method: 'GET',
        url: `http://127.0.0.1:3000/api/size/${username}`,
        json: true
    }, (error, response) => {
        var size = response.body.size
        var maxSize = (10*1024*1024)-size
        var upload = multer({
            storage: Storage,
            limits: { fileSize: maxSize }
        }).array('fileUploader', 3) //Field name and max count

        upload(req, res, (err) => {
            logError(err)
            if (!err) console.log('file uploaded')
            res.redirect('/')
        })
    })
})

app.put('/api/update/:filename', (req, res) => {
    var filename = req.params.filename
    var newFilename = req.body.filename
    fs.rename(`./data/${filename}`, `./data/${newFilename}`, (err) => {
        logError(err)
//        console.log(`${filename} was renamed to ${newFilename}`)
        res.redirect('/')
    })
})

app.delete('/api/delete/:filename', (req, res) => {
    var filename = req.params.filename
    fs.unlink(`./data/${filename}`, (err) => {
        logError(err)
//        console.log(`${filename} was deleted`)
        res.redirect('/')
    })
})
