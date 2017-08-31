(function (global) {
    "use strict;"

    // Class ------------------------------------------------
    var Const = {};
    Const.signature = (process.env['NSMI_SECRET_KEY'] || "AfNCLlUqhgAIFKqQNmxW") ;//nsmi-secret-key
    Const.jwtSecret = (process.env['JWT_SECRET_KEY'] || "a25280fb2240a614db9954f147f045c8");//"frogchat-jwt-secret-key";
    Const.loginSignature = (process.env['LOGIN_SECRET_KEY'] || "22b44fb643dacd93dcd7b1e31b6112a5");//"frogchat-login-secret-key";
    Const.jwtExpire = "24h";
    Const.httpCodeSucceed = 200;
    Const.httpCodeFileNotFound = 404;
    Const.httpCodeSeverError = 500;
    Const.httpCodeAuthError = 503;

    Const.responsecodeSucceed = 1;
    Const.responsecodeSucceedWithExisting = 2;
    Const.resCodeLoginNoName = 1000001;
    Const.resCodeLoginNoRoomID = 1000002;
    Const.resCodeLoginNoUserID = 1000003;
    Const.resCodeUserListNoRoomID = 1000004;
    Const.resCodeMessageListNoRoomID = 1000005;
    Const.resCodeMessageListNoLastMessageID = 1000006;
    Const.resCodeSendMessageNoFile = 1000007;
    Const.resCodeSendMessageNoRoomID = 1000008;
    Const.resCodeSendMessageNoUserID = 1000009;
    Const.resCodeSendMessageNoType = 1000010;
    Const.resCodeFileUploadNoFile = 1000011;

    Const.resCodeSocketUnknownError = 1000012;
    Const.resCodeSocketDeleteMessageNoUserID = 1000013;
    Const.resCodeSocketDeleteMessageNoMessageID = 1000014;
    Const.resCodeSocketSendMessageNoRoomID = 1000015;
    Const.resCodeSocketSendMessageNoUserId = 1000016;
    Const.resCodeSocketSendMessageNoType = 1000017;
    Const.resCodeSocketSendMessageNoMessage = 1000018;
    Const.resCodeSocketSendMessageNoLocation = 1000019;
    Const.resCodeSocketSendMessageFail = 1000020;

    Const.resCodeSocketTypingNoUserID = 1000021;
    Const.resCodeSocketTypingNoRoomID = 1000022;
    Const.resCodeSocketTypingNoType = 1000023;
    Const.resCodeSocketTypingFaild = 1000024;

    Const.resCodeSocketLoginNoUserID = 1000025;
    Const.resCodeSocketLoginNoRoomID = 1000026;

    Const.resCodeTokenError = 1000027;

    Const.resCodeStickerListFailed = 1000028;
    Const.resCodeSocketChangeWithEmptyStatus = 1000029;

    Const.responsecodeParamError = 2001;
    Const.responsecodeTokenError = 2100;

    Const.messageTypeText = 1;
    Const.messageTypeFile = 2;
    Const.messageTypeLocation = 3;
    Const.messageTypeContact = 4;
    Const.messageTypeSticker = 5;

    Const.messageNewUser = 1000;
    Const.messageUserLeave = 1001;
    Const.messageUserJoinGroup = 1002;
    Const.messageCreateNewGroup = 1003;
    Const.messageUpdateGroup = 1004;

    Const.leftGroupMessage = "left the group";
    Const.joinGroupMessage = "joined the group";
    Const.createdGroupMessage = "created the group";
    Const.updatedGroupMessage = "modified this group";

    Const.sentFileMessage = "A file has been sent";
    Const.sentContactMessage = "A contact has been sent";
    Const.sentLocationMessage = "A location has been sent";
    Const.sentStickerMessage = "A sticker has been sent";

    Const.typingOn = 1;
    Const.typingOff = 0;

    Const.pagingLimit = 50;
    Const.tokenValidInteval = 1000 * 60 * 60 * 24 * 30;//30day

    Const.pushNotificationSendMessage = "PushNotification";
    Const.notificationSendMessage = "SendMessage";
    Const.notificationNewUser = "NewUser";
    Const.notificationUserTyping = "UserTyping";
    Const.notificationMessageChanges = "MessageChanges";
    Const.notificationStatusChanges = "StatusChanges";
    Const.GlobalRoomID = "frogchat";
    Const.pushNotificationTitle = "FrogChat";
    //Const
    Const.UserStatusEnum = {
        OnLine: "online",
        Away: "away",
        Busy: "busy",
        Invisible: "invisible",
        OffLine: "offline"
    };

    //Socket Join
    Const.resCodeJoinNoToken = 2000001;
    Const.resCodeJoinNoRoomID = 2000002;
    Const.resCodeJoinNoUserID = 2000003;
    //Add Contact
    Const.resCodeUserNotExist = 2000004;//User not existing
    Const.resCodeContactExisting = 2000005;//This contact is existing
    //Const.resCodeJoinNoUserID = 2000006;
    // Exports ----------------------------------------------

    Const.numberItemOfPage = 10;
    Const.ellipsize = 12;
    Const.fcm_server_api_key = (process.env['FCM_SERVER_API_KEY'] || 'AAAAy4N5p4U:APA91bHUljqXTnT23k5b6OgMCds1STAIkSSo6yjMjJ-JcYSKlF4aD_dnTF102oA9wucDGlKMwQAixM4nJUeu4uX_nWCZdfN2pBxhYsrdZa2cgB4pMZQC0PfxmJBo4IOXonvlFPIq9rwG');
    Const.resCodeInvalidSignature = 1000030;
    module["exports"] = Const;

})((this || 0).self || global);
