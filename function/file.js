var tf = require('./token')
var getSize = require('get-folder-size')
var fs = require('fs-extra')
var key = tf.key

module.exports = {
    upload: (req, res) => {
        var maxCapacity = 10 * 1024 * 1024
        var file = req.files.file
        var tmp_path = file.path
        var token = req.body.token

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
                        res.json({ message: 'File size exceeded the limit' })
                    });
                } else {
                    var target_path = `./data/${id}/${file.name}`
                    fs.rename(tmp_path, target_path, function (err) {
                        if (err) throw err
                        fs.unlink(tmp_path, function () {
                            res.json({ message: 'File uploaded' })
                        })
                    })
                }
            })

        },
            errFunc)
    },
    download: (req, res) => {
        var token = req.body.token
        var filename = req.body.filename

        tf.verify(token, key, res, decoded => {
            var id = decoded._id
            res.download(`./data/${id}/${filename}`)
        })
    },
    delete: (req, res) => {
        var token = req.body.token
        var filename = req.body.filename

        tf.verify(token, key, res, decoded => {
            var id = decoded._id
            fs.unlink(`./data/${id}/${filename}`, (err) => {
                if (err) throw err
                res.json({ message: 'Berhasil hapus' })
            })
        })
    },
    rename: (req, res) => {
        var token = req.body.token
        var oldName = req.body.oldName
        var newName = req.body.newName

        tf.verify(token, key, res, decoded => {
            var id = decoded._id
            fs.rename(`./data/${id}/${oldName}`, `./data/${id}/${newName}`, (err) => {
                if (err) throw err
                res.json({ message: 'Berhasil rename' })
            })
        })
    },
    list: (req, res) => {
        var token = req.body.token      
        var dir = req.body.dir

        tf.verify(token, key, res, decoded => {
            var id = decoded._id
            fs.readdir(`./data/${id}/${dir}`, (err, items) => {
                res.json({ items })
            })
        })
    },
    movefile: (req, res) => {
        var token = req.body.token
        var oldPath = req.body.oldPath
        var newPath = req.body.newPath

        tf.verify(token, key, res, decoded => {
            var id = decoded._id
            fs.rename(`./data/${id}/${oldPath}`, `./data/${id}/${newPath}`, (err) => {
                if (err) throw err
                res.json({ message: 'Berhasil move' })
            })
        })
    }
}