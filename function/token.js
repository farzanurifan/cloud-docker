var jwt = require('jsonwebtoken')
var isFunction = (functionToCheck) => {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

module.exports = {
    key: 'rahasia',
    verify: (token, key, res, successFunc, errFunc) => {
        jwt.verify(token, key, (err, decoded) => {
            if (err) {
                if (isFunction(errFunc)) errFunc()
                res.json({ message: 'Failed to authenticate token.' });
            } else {
                successFunc(decoded, res)
            }
        })
    }
}