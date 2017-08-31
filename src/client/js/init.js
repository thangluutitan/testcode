(function(global) {

    "use strict;"

    var Config = {};

    Config.apiBaseUrl = "http://localhost:8081/frogchat/v1";
    Config.socketUrl = "http://localhost:8081/frogchat";
    
    Config.googleMapAPIKey = "";
    
    Config.defaultContainer = "#frogchat-container";
    Config.lang = "en";
    Config.showSidebar = true;
    Config.showTitlebar = true;
    Config.useBothSide = false;
    Config.thumbnailHeight = 256;
    
    // Exports ----------------------------------------------
    module["exports"] = Config;

})((this || 0).self || global);
