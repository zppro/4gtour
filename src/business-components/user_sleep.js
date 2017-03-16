/**
 * Created by hcl on 17-3-14.
 */
var co = require('co');
var rp = require('request-promise-native');
var xml2js = require('xml2js');
module.exports={
    init: function (ctx) {
        console.log('init sleep... ');
        var self = this;
        this.file = __filename;
        this.filename = this.file.substr(this.file.lastIndexOf('/') + 1);
        this.log_name = 'bc_' + this.filename;
        this.ctx = ctx;
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
     regist:function(sendData){
         var self = this;
         return co(function*(){
            try {
                 var ret = yield rp({
                     method: 'POST',
                     url: 'http://www.qinkeshi.com:8080/ECSServer/userws/userRegister.json',
                     form: sendData
			//  type:'application/x-www-form-urlencoded'
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
	 isRegist:function(userName){
		 var self = this;
		 return co(function*(){
		    try {
		         var ret = yield rp({
		             method: 'GET',
		             url: 'http://www.qinkeshi.com:8080/ECSServer/userws/isRegistered.json?userName='+userName,
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
                    url: 'http://www.qinkeshi.com:8080/ECSServer/userws/getToken.json?uniqueId='+uniqueId,
                    json: true
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
     userAuthenticate:function(sendData){
         var self = this;
         return co(function*(){
            try {
                 var ret = yield rp({
                     method: 'POST',
                     url: 'http://www.qinkeshi.com:8080/ECSServer/userws/userAuthenticate.json',
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
	 userLogOut:function(sendData){
		 var self = this;
		 return co(function*(){
		    try {
		         var ret = yield rp({
		             method: 'POST',
		             url: 'http://www.qinkeshi.com:8080/ECSServer/userws/userLogOut.json',
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
					     url: 'http://www.qinkeshi.com:8080/ECSServer/userws/updateUserPassword.json',
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
					     url: 'http://www.qinkeshi.com:8080/ECSServer/userws/getUserDetail.json',
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
					     url: 'http://www.qinkeshi.com:8080/ECSServer/userws/updateUserDetail.json',
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
					     url: 'http://www.qinkeshi.com:8080/ECSServer/userws/sessionIsExpired.json',
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
					     url: 'http://www.qinkeshi.com:8080/ECSServer/userws/submitFeedback.json',
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
