var Utils = require("../lib/Utils");
var UserModel = require("../Models/UserModel");
var Const = require("../const");

var JoinLogic = {
    execute: function (param, onSuccess, onError) {

        var roomID = param.roomID;
        var token = param.token;

        if (Utils.isEmpty(token)) {

            if (onError)
                onError(null, Const.resCodeJoinNoToken);

            return;

        }


        if (Utils.isEmpty(roomID)) {

            if (onError)
                onError(null, Const.resCodeJoinNoRoomID);

            return;

        }


        UserModel.findUserbyToken(token, function (err, user) {
            if (err || user == null) {
                onError(err, null);
                return;
            }
            if (onSuccess) {
                onSuccess({token: user.token, user: user});
            }
        });

    }
}

module["exports"] = JoinLogic;