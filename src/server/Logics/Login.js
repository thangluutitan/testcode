var Utils = require("../lib/Utils");
var UserModel = require("../Models/UserModel");
var Const = require("../const");
var jwt = require('jsonwebtoken');

var LoginLogic = {
    execute: function (param, onSuccess, onError) {

        var userID = param.userID;
        var online_status = param.online_status;//to restore last status from clien side
        var signature = param.signature;

        if (Utils.isEmpty(userID)) {

            if (onError)
                onError(null, Const.resCodeLoginNoUserID);

            return;

        }

        if (!Utils.checkLoginSignature(userID, signature)) {
            if (onError)
                onError(null, Const.resCodeInvalidSignature);

            return;
        }

        UserModel.findUserbyId(userID, function (err, user) {

            if (user == null) {
                onError(null, Const.resCodeUserNotExist);
                return;
            } else {

                var token = user.token;
                var profile = {
                    userID: param.userID,
                    name: param.name
                };
                //check valid token and check for expired token
                try {
                    jwt.verify(token, Const.jwtSecret);
                } catch (err) {//expired
                    //regenerate token
                    token = jwt.sign(profile, Const.jwtSecret, {expiresIn: Const.jwtExpire});
                    user.token = token;
                }

                user.update({
                    token: token, //update token for user if expire
                    online_status: online_status,
                    tokenGeneratedAt: Utils.now()
                }, {}, function (err, userResult) {

                    if (err) {
                        if (onError)
                            onError(err, null);

                    } else {
                        if (onSuccess)
                            user.online_status = online_status;
                        onSuccess({
                            token: user.token,
                            user: user
                        });
                    }
                });
            }
        });
    }
}

module["exports"] = LoginLogic;