
// Farza Nurifan

// Import
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const express = require('express')
const partials = require('express-partials')
const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectID
const multer = require('multer')
const fs = require('fs')

// MongoDB config
const uri = 'mongodb+srv://farzanurifan:bismillah@bdt-6ij3v.mongodb.net/test'
const database = 'bdt'
const table = 'nba'

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

// Storage config
var Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './data');
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});

var upload = multer({
    storage: Storage
}).array('fileUploader', 3); //Field name and max count

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

app.get('/', (req, res) => res.redirect('/page/1'))

app.get('/page/:page', (req, res) => {
    var page = Number(req.params.page)
    let results = []
    let stats = null
    fs.readdir('./data', (err, files) => {
        for (let i = 0; i < files.length; i++) {
            stats = fs.statSync(`./data/${files[i]}`)
            results[i] = {
                size: stats['size'],
                filename: files[i]
            }
        }
        var paginate = pagination(files.length, page)
        res.render('index.ejs', { results, page, first: paginate.first, pages: paginate.pages, last: paginate.last, fields })
    })
})

app.get('/add', (req, res) => res.render('add.ejs', { fields }))

app.post('/create', (req, res) => {
    db.collection(table).save(req.body, (err, result) => {
        logError(err)
        console.log('saved to database')
        res.redirect('/')
    })
})

app.get('/edit/:filename', (req, res) => {
    var filename = req.params.filename
    res.render('edit.ejs', { result: { filename }, fields: ['filename'] })
})

app.put('/update/:filename', (req, res) => {
    var filename = req.params.filename
    var newFilename = req.body.filename
    fs.rename(`./data/${filename}`, `./data/${newFilename}`, (err) => {
        logError(err)
        console.log(`./data/${filename} was renamed to ${newFilename}`);
        res.redirect('/')
    });
})

app.delete('/delete/:filename', (req, res) => {
    var filename = req.params.filename
    fs.unlink(`./data/${filename}`, (err) => {
        logError(err)
        console.log(`./data/${filename} was deleted`);
        res.redirect('/')
    });
})

app.get('/download/:filename', (req, res) => {
    var filename = req.params.filename
    console.log(`${filename} downloaded`);
    var file = `./data/${filename}`;
    res.download(file);
})

app.post('/api/upload', function (req, res) {
    upload(req, res, function (err) {
        logError(err)
        console.log('file uploaded');
        res.redirect('/')
    });
});