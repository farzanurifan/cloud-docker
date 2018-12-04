
// Farza Nurifan

// Import
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const express = require('express')
const partials = require('express-partials')
const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectID

// MongoDB config
const uri = ['mongodb://192.168.33.10:27017', 'mongodb://192.168.33.11:27017', 'mongodb://192.168.33.12:27017']
const database = 'bdt'
const table = 'nba_of_the_week'

// EJS view variables
const pageItem = 10 // Items per page on table
const fields = [
    'Age', 'Conference', 'Date', 'Draft Year', 'Height', 'Player', 'Position',
    'Season', 'Season short', 'Seasons in league', 'Team', 'Weight', 'Real_value'
]

// Log
const logError = (err) => { if (err) return console.log(err) }
const logMessage = (message) => console.log(message)

// Express config
const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.set('view engine', 'ejs')
app.use(partials())

// Database connection
var db
let i = 0
const connect = (uri, i) => MongoClient.connect(uri[i], { useNewUrlParser: true, }, (err, client) => {
    logError(err)
    if (err) {
        i += 1
        if (i == 3) i = 0
        return connect(uri, i)
    }
    db = client.db(database)
    db.collection(table).find().count((err, results) => {
        if (results == null) {
            i += 1
            if (i == 3) i = 0
            return connect(uri, i)
        }
    })
})

// Start connecting
connect(uri, i)

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
app.listen(3000, () => logMessage('listening on 3000'))


// Routing //

app.get('/', (req, res) => res.redirect('/page/1'))

app.get('/page/:page', (req, res) => {
    var page = Number(req.params.page)
    db.collection(table).find().count((err, results) => {
        var paginate = pagination(results, page)
        db.collection(table).find().skip(pageItem * (page - 1)).limit(pageItem).toArray((err, results) => {
            res.render('index.ejs', { results, page, ...paginate, fields })
        })
    })
})

app.get('/add', (req, res) => res.render('add.ejs', { fields }))

app.post('/create', (req, res) => {
    db.collection(table).save(req.body, (err, result) => {
        logError(err)
        logMessage('saved to database')
        res.redirect('/')
    })
})

app.get('/edit/:id', (req, res) => {
    var id = ObjectId(req.params.id)
    db.collection(table).find(id).toArray((err, results) => {
        result = results[0]
        res.render('edit.ejs', { result, fields })
    })
})

app.put('/update/:id', (req, res) => {
    var id = ObjectId(req.params.id)
    db.collection(table).updateOne({ _id: id }, { $set: req.body }, (err, result) => {
        logError(err)
        logMessage('updated to database')
        res.redirect('/')
    })
})

app.delete('/delete/:id', (req, res) => {
    var id = ObjectId(req.params.id)
    db.collection(table).deleteOne({ _id: id }, (err, result) => {
        logError(err)
        logMessage('deleted from database')
        res.redirect('/')
    })
})