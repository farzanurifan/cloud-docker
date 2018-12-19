const pagination = require('../config/pagination').pagination
const fields = ['filename', 'size']
const request = require('request')

module.exports = {
    login: (req, res) => {
        if (req.cookies.cloud_login) return res.redirect('/')
        res.render('login.ejs', { loggedInStatus: 'Not logged in' })
    },
    logout: (req, res) => {
        res.clearCookie('cloud_login')
        res.clearCookie('cloud_dir')
        res.clearCookie('cloud_username')
        res.clearCookie('cloud_id')
        res.clearCookie('cloud_premium')
        res.redirect('/')
    },
    register: (req, res) => {
        if (req.cookies.cloud_login) return res.redirect('/')
        res.render('register.ejs', { loggedInStatus: 'Not logged in' })
    },
    home: (req, res) => res.redirect('/page/1'),
    index: (req, res) => {
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
    },
    add: (req, res) => {
        var token = req.cookies.cloud_token
        if (!token) res.redirect('/login')

        var loggedInStatus = `Logged in as ${req.cookies.cloud_username}`
        res.render('add.ejs', { fields, loggedInStatus })
    },
    edit: (req, res) => {
        var token = req.cookies.cloud_token
        if (!token) res.redirect('/login')

        var filename = req.params.filename
        var loggedInStatus = `Logged in as ${req.cookies.cloud_username}`
        res.render('edit.ejs', { result: { filename }, fields: ['filename'], loggedInStatus })
    },
    view: (req, res) => {
        var token = req.cookies.cloud_token
        if (!token) res.redirect('/login')
    
        var idUser = req.cookies.cloud_id
        var filename = req.params.filename
        var extension = filename.toLowerCase().split(".")[1]
        var loggedInStatus = `Logged in as ${req.cookies.cloud_username}`
        res.render('view.ejs', { result: { filename }, fields: ['filename'], loggedInStatus, filename, idUser, extension })
    }
}