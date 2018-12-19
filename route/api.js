var passwordHash = require('password-hash')
var MongoClient = require('mongodb').MongoClient
var fs = require('fs-extra')
var jwt = require('jsonwebtoken')
var tf = require('../function/token')
var key = tf.key

var uri = 'mongodb+srv://farzanurifan:bismillah@bdt-6ij3v.mongodb.net/test'
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
                res.redirect('/')
            }
            else {
                res.json({ message: 'Wrong password ' })
                res.redirect('/')
            }
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
        var maxCapacity = 10 * 1024 * 1024
        var file = req.files.file
        var tmp_path = file.path
        var token = req.cookies.cloud_token

        var errFunc = () => {
            fs.unlink(tmp_path)
        }

        tf.verify(token, key, res, decoded => {

            var id = decoded._id
            getSize(`./data/${id}`, (err, folderSize) => {
                var size = folderSize
                var maxSize = maxCapacity - size

                if (file.size > maxSize) {
                    fs.unlink(tmp_path, function () {
                        res.redirect('/')
                    })
                } else {
                    var target_path = `./data/${id}/${file.name}`
                    fs.rename(tmp_path, target_path, function (err) {
                        if (err) throw err
                        fs.unlink(tmp_path, function () {
                            res.redirect('/')
                        })
                    })
                }
            })

        },
            errFunc)
    },
    update: (req, res) => {
        var token = req.cookies.cloud_token
        var oldName = req.body.oldName
        var newName = req.body.newName

        tf.verify(token, key, res, decoded => {
            var id = decoded._id
            fs.rename(`./data/${id}/${oldName}`, `./data/${id}/${newName}`, (err) => {
                if (err) throw err
                res.redirect('/')
            })
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
    }
}