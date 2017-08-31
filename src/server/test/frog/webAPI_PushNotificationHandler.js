var PushNotificationHandler = require("../../WebAPI/PushNotificationHandler");
var Const = require("../../const");
var should = require('should');
var expect = require('chai').expect;

describe('WEB', function () {

    describe('Send Push Notification', function () {

        it('Send Notification without data pass when give correct registration ID.', function (done) {
            
            var param = {}                
                
            var payload = {
                registration_ids:["ciHfchMnYwo:APA91bFVHrJ39RBioWGcMDa1MXffpwz3ucRMiuX_Lbq0Z1ugtQLjR8CIhYW8CKNOEeY74Bo_VNZGoIDm8T-43Oaj6RjlxXaRQteTi9C940kCWI_z1JZ9fqUWbsnKbN1eO2SNlEfT4rOD"],
                data: {},
                priority: 'high',
                content_available: true,
                // comment for future
                notification: { title: "Notification", body: "Hello", sound : "default", badge: "1" }
            };

            var pushNotification= new PushNotificationHandler(param);
            pushNotification.Send(payload,function(err,res){
                expect(res).to.not.be.null;               
                done();
            });
        })

        it('Send Notification included data pass when give correct registration ID.', function (done) {
            
            var param = {}
                
            var payload = {
                registration_ids:["ciHfchMnYwo:APA91bFVHrJ39RBioWGcMDa1MXffpwz3ucRMiuX_Lbq0Z1ugtQLjR8CIhYW8CKNOEeY74Bo_VNZGoIDm8T-43Oaj6RjlxXaRQteTi9C940kCWI_z1JZ9fqUWbsnKbN1eO2SNlEfT4rOD"],
                data: {
                    userid: "3",
                    roomID: "58c0e9820670d33528198ec5",
                    groupName:"FrogChat",
                    avatar_file_id:"",
                    avatar_thumb_file_id:"",
                    is_group : true,
                    message: "Hello",
                    to_user: "4",
                    type: "1",
                    title: "FrogChat", 
                    body: "Hello", 
                    sound : "default", badge: "1"
                },
                priority: 'high',
                content_available: true,
                // comment for future
                notification: { title: "Notification", body: "Hello", sound : "default", badge: "1" }
            };

            var pushNotification= new PushNotificationHandler(param);
            pushNotification.Send(payload,function(err,res){
                expect(res).to.not.be.null;               
                done();
            });
        })

        it('Fail when give wrong registration ID.', function (done) {
            
            var param = {}
                
            var payload = {
                registration_ids:["123456789","ciHfchMnYwo:APA91bFVHrJ39RBioWGcMDa1MXffpwz3ucRMiuX_Lbq0Z1ugtQLjR8CIhYW8CKNOEeY74Bo_VNZGoIDm8T-43Oaj6RjlxXaRQteTi9C940kCWI_z1JZ9fqUWbsnKbN1eO2SNlEfT4rOD"],
                data: {
                    userid: "3",
                    roomID: "58c0e9820670d33528198ec5",
                    groupName:"FrogChat",
                    avatar_file_id:"",
                    avatar_thumb_file_id:"",
                    is_group : true,
                    message: "Hello",
                    to_user: "4",
                    type: "1",
                    title: "FrogChat", 
                    body: "Hello", 
                    sound : "default", badge: "1"
                },
                priority: 'high',
                content_available: true,
                // comment for future
                notification: { title: "Notification", body: "Hello", sound : "default", badge: "1" }
            };
            
            var pushNotification= new PushNotificationHandler(param);
            pushNotification.Send(payload,function(err,res){
                               
                //process.stdout.write("Type: "+ typeof res + "\n");
                //process.stdout.write("Error: "+err + "\n") ;
                //process.stdout.write("respond: "+res);
                expect(err).to.not.be.null;               
               done();
            });
        })
    })
})
 