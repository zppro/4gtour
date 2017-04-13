/**
 * Created by hcl on 17-3-14.
 * 健康助手移动接口 health center
 */
 module.exports = {
     init: function (option) {
         var self = this;
         this.file = __filename;
         this.filename = this.file.substr(this.file.lastIndexOf('/') + 1);
         this.module_name = this.filename.substr(0, this.filename.lastIndexOf('.'));
         this.service_url_prefix = '/me-services/' + this.module_name.split('_').join('/');
         this.log_name = 'mesvc_' + this.filename;
         option = option || {};
         this.logger = require('log4js').getLogger(this.log_name);
         if (!this.logger) {
             console.error('logger not loaded in ' + this.file);
         }
         else {
             this.logger.info(this.file + " loaded!");
             self.logger.info("body:" , {a:'bbb',c:'ddd'});
         }

         this.actions = [
             {
                 method: 'sleepUser$regist',//regist useing
                 verb: 'post',
                 url: this.service_url_prefix + "/sleepUser$regist",
                 handler: function (app, options) {
                     return function *(next) {
                         try {
                             var member = yield app.bed_monitor_provider.regist(this.openid, this.request.body.userInfo, this.request.body.tenantId);
                             console.log("regist reback");		
				    console.log("this.openid:",this.openid);	
                             if (member) {
                                 console.log("getToken");
                                 var token = yield app.bed_monitor_provider.getToken(member.open_id);
                                 var ret = yield app.bed_monitor_provider.userAuthenticate(member, token);
                                 var session_id = yield app.bed_monitor_provider.getSession(member.open_id)
                                 console.log(session_id);
                                 this.body = app.wrapper.res.default();
                             }
                         } catch (e) {
                             self.logger.error(e.message);
                             this.body = app.wrapper.res.error(e);
                         }
                         yield next;
                     };
                 }
             },
             {
                 method: 'sleepDevicews$addDevice',
                 verb: 'post',
                 url: this.service_url_prefix + "/sleepDevicews$addDevice",
                 handler: function (app, options) {
                     return function *(next) {
                         try {
                             console.log("body:");
                             console.log(this.request.body);
                             var ret = yield app.bed_monitor_provider.addDevice(this.request.body.deviceInfo, this.openid, this.request.body.tenantId);
                             console.log("add device back");
                             // console(ret);
                             console.log("-------------------------");
                             this.body = app.wrapper.res.ret(ret);
                         } catch (e) {
                             self.logger.error(e.message);
                             this.body = app.wrapper.res.error(e);
                         }
                         yield next;
                     };
                 }
             },
             {
                 method: 'sleepDevicews$getAttachDevice',
                 verb: 'post',
                 url: this.service_url_prefix + "/sleepDevicews$getAttachDevice",
                 handler: function (app, options) {
                     return function *(next) {
                         try {
                             console.log("body:");
                             console.log(this.request.body);
                             self.logger.info('this.request.body:', this.openid);
                             this.body = yield app.bed_monitor_provider.getDeviceInfo(this.openid);
                         } catch (e) {
                             self.logger.error(e.message);
                             this.body = app.wrapper.res.error(e);
                         }
                         yield next;
                     };
                 }
             },
             {
                 method: 'sleepDevicews$removeDevice',
                 verb: 'post',
                 url: this.service_url_prefix + "/sleepDevicews$removeDevice",
                 handler: function (app, options) {
                     return function *(next) {
                         try {
                             console.log("body:");
                             console.log(this.request.body)
                             var ret = yield app.bed_monitor_provider.removeDevice(this.openid, this.request.body.deviceId, this.request.body.tenantId);
                             console.log("ret++++:", ret);
                             this.body = app.wrapper.res.ret(ret);
                         } catch (e) {
                             self.logger.error(e.message);
                             this.body = app.wrapper.res.error(e);
                         }
                         yield next;
                     };
                 }
             },
             {
                 method: 'sleepDevicews$getDeviceDetails',
                 verb: 'post',
                 url: this.service_url_prefix + "/sleepDevicews$getDeviceDetails",
                 handler: function (app, options) {
                     return function *(next) {
                         try {
                             console.log("body:");
                             console.log(this.request.body)
                             var ret = yield app.bed_monitor_provider.getDeviceDetails(this.openid, this.request.body.devId, this.request.body.tenantId);
                             console.log("ret++++:", ret);
                             this.body = app.wrapper.res.ret(ret);
                         } catch (e) {
                             self.logger.error(e.message);
                             this.body = app.wrapper.res.error(e);
                         }
                         yield next;
                     };
                 }
             },
             {
                 method: 'sleepDevicews$changeDeviceInfo',
                 verb: 'post',
                 url: this.service_url_prefix + "/sleepDevicews$changeDeviceInfo",
                 handler: function (app, options) {
                     return function *(next) {
                         try {
                             console.log("body:");
                             console.log(this.request.body)
                             var ret = yield app.bed_monitor_provider.changeDeviceInfo(this.openid, this.request.body.deviceInfo, this.request.body.tenantId);
                             console.log("ret++++:", ret);
                             this.body = app.wrapper.res.ret(ret);
                         } catch (e) {
                             self.logger.error(e.message);
                             this.body = app.wrapper.res.error(e);
                         }
                         yield next;
                     };
                 }
             },
             {
                 method: 'sleepDevicews$isAttach',
                 verb: 'post',
                 url: this.service_url_prefix + "/sleepDevicews$isAttach",
                 handler: function (app, options) {
                     return function *(next) {
                         try {
                             console.log("body:");
                             console.log(this.request.body)
                             var ret = yield app.bed_monitor_provider.checkIsAttach(this.openid, this.request.body.deviceId, this.request.body.tenantId);
                             console.log("isAttach:", ret);
                             this.body =  app.wrapper.res.ret({isAttach:ret});
                         } catch (e) {
                             self.logger.error(e.message);
                             this.body = app.wrapper.res.error(e);
                         }
                         yield next;
                     };
                 }
             },
             {
                 method: 'sleepDevicews$test',
                 verb: 'get',
                 url: this.service_url_prefix + "/sleepDevicews$test",
                 handler: function (app, options) {
                     return function *(next) {
                         try {
                             // console.log("body:");
                             //console.log(this.request.body)"oYoT70Fw1BPC-oTUI7-Q-NiHKOq8"
                             var userInfo ={
                                 nickName:'1e1r',
                                 avatarUrl:'http://wx.qlogo.cn/mmopen/vi_32/DYAIOgq83ertBQu5V7dyLVFFXHyal599vF8WbFmuRLQ3hDeRibAia2F3icO0IjxvznIEvdAtNjicibGHhaacHiapdz7Q/0',
                                 devId:'A1100123',
                                 deviceMac:'A0E6F8855129F',
                                 cpNewName:'HCL',
                                 sex:'女',
                                 cpNewAge:'59'
                             }
                             var openid = 'oYoT70Fw1BPC-oTUI7-Q-NiHKOq8'
                            
                             var tenantId = '58cf896e2f0f0a21b026d973'
                             var deviceId = 'A1100123'
                             var member = {
                                 name:'1l42o',
                                 passhash:'e10adc3949ba59abbe56e057f20f883e',
                             }
					
                             var token='47843085';
                             var ret = yield app.bed_monitor_provider.regist(openid, userInfo, tenantId);
                              
                             console.log("isAttach:", ret);
                             this.body = "ok";
                         } catch (e) {
                             self.logger.error(e.message);
                             this.body = app.wrapper.res.error(e);
                         }
                         yield next;
                     };
                 }
             },
             {
                 method: 'sleepDevicews$changeCarePersonPortrait',
                 verb: 'post',
                 url: this.service_url_prefix + "/sleepDevicews$changeCarePersonPortrait",
                 handler: function (app, options) {
                     return function *(next) {
                         try {
                             console.log("body:");
                             console.log(this.request.body)
                             var ret = yield app.bed_monitor_provider.changeCarePersonPortrait(this.openid, this.request.body.portraitUrl,this.request.body.deviceName, this.request.body.tenantId);
                             console.log("isAttach:", ret);
                             this.body =  app.wrapper.res.ret({isAttach:ret});
                         } catch (e) {
                             self.logger.error(e.message);
                             this.body = app.wrapper.res.error(e);
                         }
                         yield next;
                     };
                 }
             }
         ];
         return this;
     }
 }.init();
