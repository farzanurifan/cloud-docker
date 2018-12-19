var passwordHash = require('password-hash')
var MongoClient = require('mongodb').MongoClient
var fs = require('fs-extra')
var jwt = require('jsonwebtoken')
var tf = require('../function/token')
var key = tf.key

var uri = 'mongodb://mongo:27017'
var database = 'cloud'
var table = 'myGallery'

var db
MongoClient.connect(uri, { useNewUrlParser: true, }, (err, client) => {
    if (err) throw err
    db = client.db(database)
})

var options = {
    maxAge: 1000 * 60 * 5, // would expire after 15 minutes
}
var fs = require('fs')

const multer = require('multer')
var Storage = dir => multer.diskStorage({
    destination: (req, file, callback) => {
        console.log(dir)
        callback(null, dir)
    },
    filename: (req, file, callback) => {
        callback(null, file.originalname)
    }
})

module.exports = {
    login: (req, res) => {
        var email = req.body.email
        var password = req.body.password

        db.collection(table).find({ email }).toArray((err, results) => {
            result = results[0]
            if (!result) return res.json({ message: 'User not found' })

            var loggedIn = passwordHash.verify(password, result.password)
            if (loggedIn) {
                var token = jwt.sign(result, key, { expiresIn: 5 * 60 }) // dalam detik
                res.cookie('cloud_token', token, options)
                res.cookie('cloud_dir', `./data/${result._id}/`, options)
            }
            res.redirect('/')
        })
    },
    register: (req, res) => {
        var name = req.body.name
        var email = req.body.email
        var password = passwordHash.generate(req.body.password)
        var data = { name, email, password, premium: false }
        db.collection(table).save(data, (err, result) => {
            if (!err) {
                dir = `./data/${result.ops[0]._id}`
                fs.mkdirSync(dir)
                res.redirect('/')
            }
        })
    },
    upload: (req, res) => {
        var dir = req.cookies.cloud_dir
        var maxCapacity = 10 * 1024 * 1024

        var size = 10
        var maxSize = maxCapacity - size
        var upload = multer({
            storage: Storage(dir),
            limits: { fileSize: maxSize }
        }).array('file', 3) // Field name and max count

        upload(req, res, (err) => {
            res.redirect('/')
        })
    },
    update: (req, res) => {
        var filename = req.params.filename
        var newFilename = req.body.filename
        fs.rename(`./data/${filename}`, `./data/${newFilename}`, (err) => {
            console.log(`./data/${filename} was renamed to ${newFilename}`)
            res.redirect('/')
        })
    },
    delete: (req, res) => {
        var token = req.cookies.cloud_token
        var filename = req.params.filename

        tf.verify(token, key, res, decoded => {
            var id = decoded._id
            fs.unlink(`./data/${id}/${filename}`, (err) => {
                if (err) throw err
                res.redirect('/')
            })
        })
    },
    download: (req, res) => {
        var token = req.cookies.cloud_token
        var filename = req.params.filename

        tf.verify(token, key, res, decoded => {
            var id = decoded._id
            res.download(`./data/${id}/${filename}`)
        })
    },
    rmdir: (req, res) => {
        var token = req.cookies.cloud_token

        tf.verify(token, key, res, decoded => {

            var id = decoded._id
            var dir = `./data/${id}/${req.params.dir}`
            if (fs.existsSync(dir)) {
                fs.rmdirSync(dir)
            }
            res.redirect('/')

        })
    }
}