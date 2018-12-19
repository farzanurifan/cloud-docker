var pagination = require('../config/pagination').pagination
var fields = ['filename', 'size']
var request = require('request')
var tf = require('../function/token')
var key = tf.key
var fs = require('fs-extra')

module.exports = {
    login: (req, res) => {
        if (req.cookies.cloud_login) return res.redirect('/')
        res.render('login.ejs', { loggedInStatus: 'Not logged in' })
    },
    logout: (req, res) => {
        res.clearCookie('cloud_token')
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

        
        tf.verify(token, key, res, decoded => {
            var id = decoded._id
            fs.readdir(`./data/${id}/${dir}`, (err, items) => {
                var paginate = pagination(items.length, page)
                let results = []
                for (let i = 0; i < items.length; i++) {
                    results[i] = {
                        size: 'dummy',
                        filename: items[i]
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
            })
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