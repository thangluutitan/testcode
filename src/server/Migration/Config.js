var Config = {
    DatabaseUrlV2: "mongodb://localhost/frogchatv2",//frogchat
    DatabaseUrlV1: "mongodb://localhost/frogchatv1",//frogchat
    CollectionPrefixV2: "frog_",
    CollectionPrefixV1: "",
    PageSize : 1000,//10 fast for test - set 1000 for production
    MaxPage: 0 //for test set to 0 for production
}
if (process.env['MONGOV1_USERNAME'] && process.env['MONGOV1_PASSWORD']){
    Config.DatabaseUrlV1 = "mongodb://" +
        (process.env['MONGOV1_USERNAME'] || 'staff') + ":" +
        (process.env['MONGOV1_PASSWORD'] || 'staff') + "@" +
        (process.env['MONGOV1_HOST'] || 'localhost') + ":" +
        (process.env['MONGOV1_PORT'] || '27017') +
        "/" + process.env['MONGOV1_DBNAME'] || 'frogchatV1';
}else{
    Config.DatabaseUrlV1 = "mongodb://" +
        (process.env['MONGOV1_HOST'] || 'localhost') + ":" +
        (process.env['MONGOV1_PORT'] || '27017') +
        "/" + (process.env['MONGOV1_DBNAME'] || 'frogchatV1');
}

if (process.env['MONGOV2_USERNAME'] && process.env['MONGOV2_PASSWORD']){
    Config.DatabaseUrlV2 = "mongodb://" +
        (process.env['MONGOV2_USERNAME'] || 'staff') + ":" +
        (process.env['MONGOV2_PASSWORD'] || 'staff') + "@" +
        (process.env['MONGOV2_HOST'] || 'localhost') + ":" +
        (process.env['MONGOV2_PORT'] || '27017') +
        "/" + (process.env['MONGOV2_DBNAME'] || 'frogchatV2');
}else{
    Config.DatabaseUrlV2 = "mongodb://" +
        (process.env['MONGOV2_HOST'] || 'localhost') + ":" +
        (process.env['MONGOV2_PORT'] || '27017') +
        "/" + (process.env['MONGOV2_DBNAME'] || 'frogchatV2');
}



module["exports"] = Config;