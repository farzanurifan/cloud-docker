
var passwordHash = require('password-hash')
var MongoClient = require('mongodb').MongoClient
var fs = require('fs-extra')
var jwt = require('jsonwebtoken')
var key = require('./token').key

var uri = 'mongodb+srv://farzanurifan:bismillah@bdt-6ij3v.mongodb.net/test'
var database = 'cloud'
var table = 'myGallery'

var db
MongoClient.connect(uri, { useNewUrlParser: true, }, (err, client) => {
    if (err) throw err
    db = client.db(database)
})

module.exports = {
    login: (req, res) => {
        var email = req.body.email
        var password = req.body.password
        console.log('kaka')

        db.collection(table).find({ email }).toArray((err, results) => {
            result = results[0]
            if (!result) return res.json({ message: 'User not found' })

            var loggedIn = passwordHash.verify(password, result.password)
            if (loggedIn) {
                var token = jwt.sign(result, key, { expiresIn: 5 * 60 }) // dalam detik
                res.json({ message: 'OK', token })
            }
            else res.json({ message: 'Wrong password ' })
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
                console.log(dir)
                fs.mkdirSync(dir)
                res.json({ message: 'User created' })
            }
        })
    }
}