var tf = require('./token')
var fs = require('fs-extra')
var key = tf.key
const getSize = require('get-folder-size')

module.exports = {
    mkdir: (req, res) => {
        var token = req.body.token

        tf.verify(token, key, res, decoded => {

            var id = decoded._id
            var dir = `./data/${id}/${req.body.dir}`
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir)
                res.json({ message: 'ok' })
            }
            else {
                res.json({ message: 'udah ada' })
            }

        })
    },
    rmdir: (req, res) => {
        var token = req.body.token

        tf.verify(token, key, res, decoded => {

            var id = decoded._id
            var dir = `./data/${id}/${req.body.dir}`
            if (!fs.existsSync(dir)) {
                res.json({ message: 'ga ada' })
            }
            else {
                fs.removeSync(dir)
                res.json({ message: 'ok' })
            }

        })
    },
    listdir: (req, res) => {
        var token = req.body.token
        var dir = req.body.dir

        tf.verify(token, key, res, decoded => {

            var id = decoded._id
            fsPath.find(`./data/${id}/${dir}`, (err, list) => {
                var dirs = list.dirs
                let len = dirs.length
                let directory = []
                while (len--) {
                    directory[len] = dirs[len].split('\\').slice(2)
                }
                res.json({ directory })
            })

        })
    },
    movedir: (req, res) => {
        var token = req.body.token
        var oldPath = req.body.oldPath
        var newPath = req.body.newPath

        tf.verify(token, key, res, decoded => {

            var id = decoded._id
            fs.move(`./data/${id}/${oldPath}`, `./data/${id}/${newPath}`, err => {
                res.json({ message: 'Berhasil move' })
            })

        })
    },
    sizedir: (req, res) => {
        var token = req.body.token
        tf.verify(token, key, res, decoded => {

            var id = decoded._id
            var dir = `./data/${id}/`
            getSize(dir, (err, size) => {
                if (err) throw err

                res.json({ message: (size / 1024).toFixed(2) + ' kb' })

            })


        })
    }
}