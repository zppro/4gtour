/**
 * Created by hcl on 17-3-14.
 */
 var co = require('co');
 var rp = require('request-promise-native');
 var xml2js = require('xml2js');
 var externalSystemConfig = require('../pre-defined/external-system-config.json');
//  var qinkeshi = externalSystemConfig.bed_monitor_provider.api_url;
var qinkeshi;
 module.exports={
    init: function (ctx) {
        console.log('init sleep... ');
        var self = this;
        this.file = __filename;
        this.filename = this.file.substr(this.file.lastIndexOf('/') + 1);
        this.log_name = 'bc_' + this.filename;
        this.ctx = ctx;
        this.CACHE_MODULE = 'N-BED-M-P-';
        this.CACHE_ITEM_SESSION = 'SESSIONID';
        this.logger = require('log4js').getLogger(this.log_name);
        if (!this.logger) {
            console.error('logger not loaded in ' + this.file);
        }
        else {
            this.logger.info(this.file + " loaded!");
        }
        console.log(this.filename + ' ready... ');
        return this;
    },
    getSession: function (gen_session_key) {
        var self = this;
        return co(function*(){
          try {
             var key = self.CACHE_MODULE + self.CACHE_ITEM_SESSION + '@' + gen_session_key;
             console.log("getToken1");
             console.log(self.ctx.cache.get(key));
             if(!self.ctx.cache.get(key)){
                console.log("getToken2");
                var member = yield self.ctx.modelFactory().model_one(self.ctx.models['het_member'], { where: {
                 open_id:gen_session_key
             }});
                console.log(member.session_id_hzfanweng);
                return member.session_id_hzfanweng;
            }
            return self.ctx.cache.get(key);
        }
        catch (e) {
         console.log(e);
         self.logger.error(e.message);
     }

 }).catch(self.ctx.coOnError);     
    },
    setSession: function (gen_session_key,sessionId) {
        var self = this;
        return co(function*(){
          try {
              var key = self.CACHE_MODULE + self.CACHE_ITEM_SESSION + '@' + gen_session_key;
              self.ctx.cache.put(key,sessionId);
              var member =yield self.ctx.modelFactory().model_one(self.ctx.models['het_member'], { where: {
                 open_id: gen_session_key
             }});
              member.session_id_hzfanweng = sessionId;
              yield member.save();
          }
          catch (e) {
             console.log(e);
             self.logger.error(e.message);
         }

     }).catch(self.ctx.coOnError);     


    },
    regist:function(session,userInfo){
       var self = this;
       return co(function*(){
        try {
         var member =yield self.ctx.modelFactory().model_one(self.ctx.models['het_member'], { where: {
             open_id: session.openid,
             status:1
         }});
         if(member){
            return member;
        }
        console.log("no regist"); 
        var psd=self.ctx.crypto.createHash('md5').update('123456').digest('hex');
        
        var ret = yield rp({
           method: 'POST',
           url: qinkeshi+'/ECSServer/userws/userRegister.json',
                    // form: {userName:userInfo.nickName,encryptedName:userInfo.nickName,encryptedPwd:psd,userType:"zjwsy"}
                    form: {userName:'testt',encryptedName:'testt',encryptedPwd:psd,userType:"zjwsy"}
                });    
        ret = JSON.parse(ret);
        if(ret.retCode=='success'){
            console.log(" sync regist success");
            member.sync_flag_hzfanweng = true;
            yield member.save(); 
        }

        return member;
    }
    catch (e) {
       console.log(e);
       self.logger.error(e.message);
   }

}).catch(self.ctx.coOnError);

   },
   addDevice:function (deviceInfo,session) {
    var self = this;
    return co(function *() {
        try {
            var session_id =yield self.getSession(session.openid);
            console.log(session_id);
            var device = yield self.ctx.modelFactory().model_one(self.ctx.models['pub_bedMonitor'], { where: {
             code: deviceInfo.deviceMac,
             status:1
         }});
            if (device) {
                return device
            }  
            var device = {
                devId:deviceInfo.devId,
                name:"睡眠监测仪"
            };
            device =JSON.stringify(device);
            var sendData = {
                sessionId:session_id,
                type:deviceInfo.type,
                operator:deviceInfo.operator,
                device:device
            }; 
           console.log(sendData);
            var retDevice =yield self.updateDevice(sendData);
            console.log(retDevice);
            // var ConcernPersonJson = {
            //     sessionId:session_id,
            //     cpNewName:deviceInfo.cpNewName,
            //     cpNewAge:deviceInfo.cpNewAge,
            //     cpNewGender:deviceInfo.cpNewGender
            // };
            //ConcernPersonJson = JSON.stringify(ConcernPersonJson);
           var setUserConcernPersonJson = {setUserConcernPersonJson:{
                sessionId:session_id,
                cpNewName:deviceInfo.cpNewName,
                cpNewAge:deviceInfo.cpNewAge,
                cpNewGender:deviceInfo.cpNewGender
            }};
            console.log(setUserConcernPersonJson);
            var retCp =yield self.updateConcernPerson(setUserConcernPersonJson);
           console.log(retCp);

            // device  = yield self.ctx.modelFactory().model_create(self.ctx.models['pub_bedMonitor'], {
            //                        // open_id:session.openid,
            //                        code:deviceInfo.deviceMac,
            //                        name:deviceInfo.devId,
            //                    });            
            // console.log(device);
            return "ok";                    
        }
        catch (e) {
            console.log(e);
            self.logger.error(e.message);
        }
    }).catch(self.ctx.coOnError);
},

isRegist:function(userName){
 var self = this;
 return co(function*(){
  try {
     var ret = yield rp({
         method: 'GET',
         url: qinkeshi+'/ECSServer/userws/isRegistered.json?userName='+userName,
         json:true
     });

     console.log(ret);
     return self.ctx.wrapper.res.default();
 }
 catch (e) {
     console.log(e);
     self.logger.error(e.message);
 }

}).catch(self.ctx.coOnError);

},

getToken:function (uniqueId) {
    var self = this;
    return co(function *() {
        try {
            console.log(uniqueId);
            var ret = yield rp({
                url: qinkeshi+'/ECSServer/userws/getToken.json?uniqueId='+uniqueId,
                json: true
            });
            console.log(ret);
            console.log(ret.retCode);
            return ret.retValue;                    
        }
        catch (e) {
            console.log(e);
            self.logger.error(e.message);
        }
    }).catch(self.ctx.coOnError);
},

userAuthenticate:function(member,token){
   var self = this;
   return co(function*(){
    try {
       var ret = yield rp({
           method: 'POST',
           url: qinkeshi  +'/ECSServer/userws/userAuthenticate.json',
           form: {token:token,userName:member.name,encryptedName:member.name,encryptedPwd:member.passhash,userType:"zjwsy"}
       });
       ret = JSON.parse(ret);
       if(ret.retCode == 'success'){
        self.setSession(member.open_id,ret.retValue.sessionId);
        return "success";
    }else{
       return self.ctx.wrapper.res.default();
   }
}
catch (e) {
   console.log(e);
   self.logger.error(e.message);
}

}).catch(self.ctx.coOnError);

},

updateDevice:function(sendData){
   var self = this;
   return co(function*(){
    try {
       var ret = yield rp({
           method: 'POST',
           url: qinkeshi+'/ECSServer/devicews/updateDevice',
           form: sendData
       });

       console.log(ret);
       return self.ctx.wrapper.res.default();
   }
   catch (e) {
       console.log(e);
       self.logger.error(e.message);
   }

}).catch(self.ctx.coOnError);

}, 
updateConcernPerson:function(sendData){ //
 var self = this;
 return co(function*(){
    try {
     var ret = yield rp({
         method: 'POST',
         url: qinkeshi+'/ECSServer/cpws/updateConcernPerson.json',
         form: sendData
     });

     console.log(ret);
     return self.ctx.wrapper.res.default();
 }
 catch (e) {
     console.log(e);
     self.logger.error(e.message);
 }

}).catch(self.ctx.coOnError);

},

updateDeviceAttachState:function(sendData){
 var self = this;
 return co(function*(){
    try {
     var ret = yield rp({
         method: 'POST',
         url: qinkeshi+'/ECSServer/devicews/updateDeviceAttachState',
         form: sendData,
         json:true
     });

     console.log(ret);
     return self.ctx.wrapper.res.default();
 }
 catch (e) {
     console.log(e);
     self.logger.error(e.message);
 }

}).catch(self.ctx.coOnError);

},



}
