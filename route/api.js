var request = require('request')
var options = {
    maxAge: 1000 * 60 * 5, // would expire after 15 minutes
}
var fs = require('fs')
var download = function (uri, filename, form, callback) {
    request.head(uri, form, function (err, res, body) {
        console.log('content-type:', res.headers['content-type']);
        console.log('content-length:', res.headers['content-length']);

        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    })
}


module.exports = {
    login: (req, res) => {
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
                res.cookie('cloud_token', data.token, options)
            }
            res.redirect('/')
        })
    },
    register: (req, res) => {
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
    },
    upload: (req, res) => {
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
    },
    update: (req, res) => {
        var userId = req.cookies.cloud_id
        var filename = req.params.filename
        var newFilename = req.body.filename
        fs.rename(`./data/${userId}/${filename}`, `./data/${userId}/${newFilename}`, (err) => {
            logError(err)
            res.redirect('/')
        })
    },
    delete: (req, res) => {
        var userId = req.cookies.cloud_id
        var filename = req.params.filename
        fs.unlink(`./data/${userId}/${filename}`, (err) => {
            logError(err)
            res.redirect('/')
        })
    },
    download: (req, res) => {
        var token = req.cookies.cloud_token
        if (!token) res.redirect('/login')

        var filename = req.params.filename
        download('http://localhost:3000/api/download/', filename, { form: { token, filename } }, function () {
            console.log('done')
        })
        // request.post('http://localhost:3000/api/download', {
        // form: {
        //     token,
        //     filename
        // }
        // }, (error, response, body) => {
        //     fs.writeFile("./data/coba.png", body, function (err) {
        //         if (err) {
        //             return console.log(err);
        //         }

        //         console.log("The file was saved!");
        //     })
        //     res.download('./data/coba.png')
        // })
    }
}