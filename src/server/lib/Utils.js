var _ = require('lodash');
var Const = require("../const");
var debug = require('debug')('frogchat:utils');
var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");

var Utils = {

    randomString: function (len, charSet) {

        charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var randomString = '';

        for (var i = 0; i < len; i++) {
            var randomPoz = Math.floor(Math.random() * charSet.length);
            randomString += charSet.substring(randomPoz, randomPoz + 1);
        }

        return randomString;
    },
    isEmpty: function (variable) {

        if (_.isUndefined(variable))
            return true;

        if (_.isNull(variable))
            return true;

        if (_.isString(variable) && _.isEmpty(variable))
            return true;

        return false;

    },
    localizeString: function (str) {

        return str;
    },
    now: function () {
        return Math.floor(Date.now());
    },
    stripPrivacyParams: function (user) {
        if(user._doc !== undefined)
        {
            delete user._doc.token;
        }else
        {
            delete user.token;
        }
        return user;
    },
    stripPrivacyParamsFromArray: function (users) {

        var result = [];
        var self = this;

        _.forEach(users, function (user) {

            result.push(self.stripPrivacyParams(user));

        });


        return result;
    },
    checkSignature: function (params,signature) {
        const crypto = require('crypto');
        var shasum = crypto.createHash('sha1','utf-8');
        var signdata = Const.signature + params[0] + params [1]; //[email, etime]
        shasum.update(new Buffer(signdata));
        signdata = shasum.digest('base64');
        debug("API Signature received: %s against expected %s from request", signdata, signature);
        return (signdata === signature );
    },

    checkLoginSignature: function (userID,signature) {
        const crypto = require('crypto');
        var shasum = crypto.createHash('md5');
        var signdata = Const.loginSignature + userID;
        shasum.update(new Buffer(signdata));
        signdata = shasum.digest('hex');
        debug("API Signature received: %s against expected %s from request", signdata, signature);
        return (signdata === signature );
    },
    ShowCurrentDateTime:function(objToday){
        //objToday =  Date.now();
        //var objToday = new Date(),
        var weekday = new Array('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
            dayOfWeek = weekday[objToday.getDay()],
            domEnder = function() { var a = objToday; if (/1/.test(parseInt((a + "").charAt(0)))) return "th"; a = parseInt((a + "").charAt(1)); return 1 == a ? "st" : 2 == a ? "nd" : 3 == a ? "rd" : "th" }(),
            dayOfMonth = today + ( objToday.getDate() < 10) ? '0' + objToday.getDate() + domEnder : objToday.getDate() + domEnder,
            months = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'),
            curMonth = months[objToday.getMonth()],
            curYear = objToday.getFullYear(),
            curHour = objToday.getHours() > 12 ? objToday.getHours() - 12 : (objToday.getHours() < 10 ? "0" + objToday.getHours() : objToday.getHours()),
            curMinute = objToday.getMinutes() < 10 ? "0" + objToday.getMinutes() : objToday.getMinutes(),
            curSeconds = objToday.getSeconds() < 10 ? "0" + objToday.getSeconds() : objToday.getSeconds(),
            curMeridiem = objToday.getHours() > 12 ? "PM" : "AM";
        var today = curHour + ":" + curMinute + "." + curSeconds + curMeridiem + " " + dayOfWeek + " " + dayOfMonth + " of " + curMonth + ", " + curYear;
        return today;
    },

    ShowDiffDateTime(laterdate, earlierdate) {
        var diff = (laterdate.getTime()-earlierdate.getTime())
        var h = Math.floor(diff/1000/60/60)
        var m = ('0' + Math.floor((diff/1000/60)%60) ).substr(-2)
        var s = ('0' + Math.floor((diff/1000)%60) ).substr(-2)
        return   h + ':' + m + ':' + s + '(h:m:s)';
    },
    CheckvalidGroup:function(groupId){
        return checkForHexRegExp.test(groupId);
    },
    Ellipsize: function(str,maxLength,sepStr){
        if (Utils.isEmpty(str)||str.length<maxLength)
            return str;

        var sep = sepStr ? sepStr:"..";
        var sepLen = sep.length;

        var len, center, n, front, back;
        len = str.length;
        center = len / 2;
        n = -0.5 * (maxLength - len - sepLen);
        front = str.substr(0, center - n);
        back = str.substr(len - center + n);
        return front + sep + back;
    }

}

module["exports"] = Utils;