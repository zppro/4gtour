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
            /**
                *注册
                */
             regist:function(sendData){
                 var self = this;
                 return co(function*(){
                    try {
                         var ret = yield rp({
                             method: 'POST',
                             url: qinkeshi+'/ECSServer/userws/userRegister.json',
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
             /**
                *是否注册
                */
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
         /**
        *获取Token
        */
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
                    return self.ctx.wrapper.res.default();
                }
                catch (e) {
                    console.log(e);
                    self.logger.error(e.message);
                }
            }).catch(self.ctx.coOnError);
        },
            /**
                *登录认证
                */
             userAuthenticate:function(sendData){
                 var self = this;
                 return co(function*(){
                    try {
                         var ret = yield rp({
                             method: 'POST',
                             url: qinkeshi  +'/ECSServer/userws/userAuthenticate.json',
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
            /**
                *用户登出
                */
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
                         /**
                            *修改账户密码
                            */
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
                           /**
                            *获取用户详情
                            */
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
                        /**
                            *修改账户信息
                            */
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
                        /**
                            *登陆是否失效
                            */
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
                        /**
                            *提交用户反馈
                            */
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
                         /**
                            *获取所有关心的人列表
                            */
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
           /**
            *增删改关心的人
            */
                updateConcernPerson:function(sendData){
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
           /**
            *获取关心的人绑定的设备信息
            */
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

          /**
            *修改关系的人字段信息
            */
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
           /**
            *设备与关心的人绑定、解绑
            */
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
            /**
            *设备增删改接口
            */
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
          /**
            *根据设备Id获取设备信息
            */
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
          /**
            *获取已添加的某种类型的设备列表
            */
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
          /**
            *获取已添加的所有设备列表
            */
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
           /**
            *获取可绑定的设备列表
            */
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
          /**
            *获取设备的报警设置
            */
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
            /**
            *设备的报警设置
            */
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
           /**
            *获取睡眠简报
            */
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
          /**
            *获取设备当前最新的状态
            */
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
            /**
            *获取指定时间段的设备所有状态
            */
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
          /**
            *获取指定时间段内的每日报告
            */
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
