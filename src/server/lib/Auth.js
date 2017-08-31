var _ = require('lodash');
var jwt = require('jsonwebtoken');
var Const = require("../const");

function checkToken(request, response, next) {

    var token = request.headers['access-token'];
    if (_.isEmpty(token)) {

        response.json({
            code: Const.resCodeTokenError
        });
        return;
    }
    var decoded = null;
    try {
        decoded = jwt.verify(token, Const.jwtSecret);
    } catch (err) {//expired
        response.json({
            code: Const.resCodeTokenError
        });
        return;
    }

    if (decoded !== null && decoded.userID.length > 0) {
        next();
    } else {
        response.json({
            code: Const.resCodeTokenError
        });
        return;
    }
}

module.exports = checkToken;
