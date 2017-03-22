/**
 * Created by hcl on 17-3-14.
 */
 var co = require('co');
 var rp = require('request-promise-native');
 var xml2js = require('xml2js');
 var qinkeshi = "http://www.qinkeshi.com:8080"
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
             console.log(self.ctx.cache.get(key));
             if(!self.ctx.cache.get(key)){
                 var member = yield self.ctx.modelFactory().model_one(self.ctx.models['het_member'], { where: {
                     open_id:gen_session_key
                 }});
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
        member  = yield self.ctx.modelFactory().model_create(self.ctx.models['het_member'], {
                                   // open_id:session.openid,
                                   open_id:session.openid,
                                   name:userInfo.nickName,
                                   passhash: psd,
                                   head_portrait:userInfo.avatarUrl
                               });
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

userLogOut:function(sendData){
 var self = this;
 return co(function*(){
  try {
     var ret = yield rp({
         method: 'POST',
         url: qinkeshi+'/ECSServer/userws/userLogOut.json',
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

updateUserPassword:function(sendData){
   var self = this;
   return co(function*(){
    try {
      var ret = yield rp({
          method: 'POST',
          url: qinkeshi+'/ECSServer/userws/updateUserPassword.json',
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

getUserDetail:function(sendData){
   var self = this;
   return co(function*(){
    try {
      var ret = yield rp({
          method: 'POST',
          url: qinkeshi+'/ECSServer/userws/getUserDetail.json',
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

updateUserDetail:function(sendData){
   var self = this;
   return co(function*(){
    try {
      var ret = yield rp({
          method: 'POST',
          url: qinkeshi+'/ECSServer/userws/updateUserDetail.json',
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

sessionIsExpired:function(sendData){
   var self = this;
   return co(function*(){
    try {
      var ret = yield rp({
          method: 'POST',
          url: qinkeshi+'/ECSServer/userws/sessionIsExpired.json',
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

submitFeedback:function(sendData){
   var self = this;
   return co(function*(){
    try {
      var ret = yield rp({
          method: 'POST',
          url: qinkeshi+'/ECSServer/userws/submitFeedback.json',
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

getConcernPerson:function(sendData){
   var self = this;
   return co(function*(){
    try {
      var ret = yield rp({
          method: 'POST',
          url: qinkeshi+'/ECSServer/userws/getConcernPerson.json',
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

           getCpAttachedDev:function(sessionId,cpId){
               var self = this;
               return co(function*(){
                try {
                   var ret = yield rp({
                       method: 'GET',
                       url: qinkeshi+'/ECSServer/cpws/getCpAttachedDev.json?sessionId='+sessionId+'&cpId='+cpId,
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


           updateConcernPersonParam:function(sendData){
               var self = this;
               return co(function*(){
                try {
                   var ret = yield rp({
                       method: 'POST',
                       url: qinkeshi+'/ECSServer/cpws/updateConcernPersonParam.json',
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

           getManufactDev:function(sendData){
               var self = this;
               return co(function*(){
                try {
                   var ret = yield rp({
                       method: 'POST',
                       url: qinkeshi+'/ECSServer/devicews/getManufactDev',
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

           getDevListByType:function(sendData){
               var self = this;
               return co(function*(){
                try {
                   var ret = yield rp({
                       method: 'POST',
                       url: qinkeshi+'/ECSServer/devicews/getDevListByType',
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

           getAllDevInfoList:function(sendData){
               var self = this;
               return co(function*(){
                try {
                   var ret = yield rp({
                       method: 'POST',
                       url:qinkeshi+'/ECSServer/devicews/getAllDevInfoList',
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

           getUserCpDevList:function(sendData){
               var self = this;
               return co(function*(){
                try {
                   var ret = yield rp({
                       method: 'POST',
                       url: qinkeshi+'/ECSServer/userws/getUserCpDevList.json',
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

           getDevAlarmSetting:function(sendData){
               var self = this;
               return co(function*(){
                try {
                   var ret = yield rp({
                       method: 'POST',
                       url: qinkeshi+'/ECSServer/devicews/getDevAlarmSetting',
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

           updateDevAlarmSetting:function(sendData){
               var self = this;
               return co(function*(){
                try {
                   var ret = yield rp({
                       method: 'POST',
                       url: qinkeshi+'/ECSServer/devicews/updateDevAlarmSetting',
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

           getSleepBriefReport:function(sendData){
               var self = this;
               return co(function*(){
                try {
                   var ret = yield rp({
                       method: 'POST',
                       url: 'http://www.qinkeshi:8080/ECSServer/cpws/getSleepBriefReport.json',
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

           getLatestSmbPerMinuteRecord:function(sendData){
               var self = this;
               return co(function*(){
                try {
                   var ret = yield rp({
                       method: 'POST',
                       url: 'http://www.qinkeshi:8080/ECSServer/cpws/getLatestSmbPerMinuteRecord.json',
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

           getSmbPerMinuteRecord:function(sendData){
               var self = this;
               return co(function*(){
                try {
                   var ret = yield rp({
                       method: 'POST',
                       url: 'http://www.qinkeshi:8080/ECSServer/cpws/getSmbPerMinuteRecord.json',
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

           getStatisticsReportByDevId:function(sendData){
               var self = this;
               return co(function*(){
                try {
                   var ret = yield rp({
                       method: 'POST',
                       url: 'http://www.qinkeshi:8080/ECSServer/cpws/getStatisticsReportByDevId.json',
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

           }
       }
