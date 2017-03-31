/**
 * Created by hcl on 17-3-14.
 */
var co = require('co');
var rp = require('request-promise-native');
var externalSystemConfig = require('../pre-defined/external-system-config.json');
var DIC = require('../pre-defined/dictionary-constants.json');
var socketServerEvents = require('../pre-defined/socket-server-events.json');
 module.exports= {
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
         this.isExecuting = false;
         if (!this.logger) {
             console.error('logger not loaded in ' + this.file);
         }
         else {
             this.logger.info(this.file + " loaded!");
         }
         this.isExecuting = false;
         console.log(this.filename + ' ready... ');
         return this;
     },
     getSession: function (gen_session_key) {
         var self = this;
         return co(function*() {
             try {
                 var key = self.CACHE_MODULE + self.CACHE_ITEM_SESSION + '@' + gen_session_key;
                 console.log("getToken1");
                 if (!self.ctx.cache.get(key)) {
                     console.log("getToken2");
                     var member = yield self.ctx.modelFactory().model_one(self.ctx.models['het_member'], {
                         select: 'session_id_hzfanweng',
                         where: {
                             open_id: gen_session_key
                         }
                     });
                     if (member) {
                         console.log('member exist ', member.session_id_hzfanweng);
                         self.ctx.cache.put(key, member.session_id_hzfanweng);
                         return member.session_id_hzfanweng;
                     }
                     console.log(1234);
                     return null;
                 }
                 return self.ctx.cache.get(key);
             }
             catch (e) {
                 console.log(e);
                 self.logger.error(e.message);
             }

         }).catch(self.ctx.coOnError);
     },
     setSession: function (gen_session_key, sessionId) {
         var self = this;
         return co(function*() {
             try {
                 var key = self.CACHE_MODULE + self.CACHE_ITEM_SESSION + '@' + gen_session_key;
                 self.ctx.cache.put(key, sessionId);
                 var member = yield self.ctx.modelFactory().model_one(self.ctx.models['het_member'], {
                     where: {
                         open_id: gen_session_key
                     }
                 });
                 member.session_id_hzfanweng = sessionId;
                 yield member.save();
             }
             catch (e) {
                 console.log(e);
                 self.logger.error(e.message);
             }
         }).catch(self.ctx.coOnError);
     },
     login: function (openId) {
         var self = this;
         return co(function*() {
             try {
                 console.log("login again");
                 var member = yield self.ctx.modelFactory().model_one(self.ctx.models['het_member'], {
                     where: {
                         open_id: openId,
                         status: 1
                     }
                 });
                 if (member) {
                     var token = yield self.getToken(member.open_id);
                     var ret = yield self.userAuthenticate(member, token);
                     var session_id = yield self.getSession(openId);
                     return session_id;
                 }
             }
             catch (e) {
                 console.log(e);
                 self.logger.error(e.message);
             }

         }).catch(self.ctx.coOnError);
     },
     checkSessionIsExpired: function (sessionId) {
         var self = this;
         return co(function*() {
             try {
                 var ret = yield rp({
                     method: 'POST',
                     url: externalSystemConfig.bed_monitor_provider.api_url + '/ECSServer/userws/sessionIsExpired.json',
                     form: {sessionId: sessionId},
                 });
                 ret = JSON.parse(ret);
                 if (ret.retCode == "fail") {
                     if (ret.retValue == "0x0020") {

                         return true;
                     }
                 }
                 return false;
             }

             catch (e) {
                 console.log(e);
                 self.logger.error(e.message);
                 return true;
             }

         }).catch(self.ctx.coOnError);

     },
     checkIsRegist: function (code) {
         var self = this;
         return co(function*() {
             try {
                 var member = yield self.ctx.modelFactory().model_one(self.ctx.models['het_member'], {
                     where: {
                         open_id: code,
                         status: 1
                     }
                 });
                 return !!member;
             }
             catch (e) {
                 console.log(e);
                 self.logger.error(e.message);
             }
         }).catch(self.ctx.coOnError);
     },
     regist: function (session, userInfo, tenantId) {
         var self = this;
         return co(function*() {
             try {
                 var member = yield self.ctx.modelFactory().model_one(self.ctx.models['het_member'], {
                     where: {
                         open_id: session.openid,
                         status: 1
                     }
                 });
                 if (member) {
                     return member;
                 }
                 console.log("no regist");
                 var psd = self.ctx.crypto.createHash('md5').update('123456').digest('hex');
                 member = yield self.ctx.modelFactory().model_create(self.ctx.models['het_member'], {
                     open_id: session.openid,
                     name: userInfo.nickName,
                     passhash: psd,
                     head_portrait: userInfo.avatarUrl,
                     tenantId: tenantId
                 });
                 var ret = yield rp({
                     method: 'POST',
                     url: externalSystemConfig.bed_monitor_provider.api_url + '/ECSServer/userws/userRegister.json',
                     form: {
                         userName: userInfo.nickName,
                         encryptedName: userInfo.nickName,
                         encryptedPwd: psd,
                         userType: "zjwsy"
                     }
                     // form: {userName:'testt',encryptedName:'testt',encryptedPwd:psd,userType:"zjwsy"}
                 });
                 ret = JSON.parse(ret);
                 if (ret.retCode == 'success') {
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
     addDevice: function (deviceInfo, session, tenantId) {
         var self = this;
         return co(function *() {
             try {
                 var session_id = yield self.getSession(session.openid);
                 var cpNewGender = null;
                 var sex = null;
                 var myDate = new Date();
                 var nowYear = myDate.getFullYear();
                 var birthYear;
                 var age = deviceInfo.cpNewAge;
                 var carePerson;
                 var member;
                 if (deviceInfo.sex == "MALE") {
                     cpNewGender = 0;
                     sex = DIC.D1006.MALE;
                 } else {
                     cpNewGender = 1;
                     sex = DIC.D1006.FEMALE;
                 }
                 if (age == null || age == "") {
                     birthYear = 0;
                 } else {
                     birthYear = nowYear - Number(age);
                 }
                 var device = yield self.ctx.modelFactory().model_one(self.ctx.models['pub_bedMonitor'], {
                     where: {
                         code: deviceInfo.deviceMac,
                         status: 1
                     }
                 });
                 if (device) { //device existed
                     member = yield self.ctx.modelFactory().model_one(self.ctx.models['het_member'], {
                         where: {
                             open_id: session.openid,
                             status: 1
                         }
                     });
                     carePerson = yield self.ctx.modelFactory().model_create(self.ctx.models['het_memberCarePerson'], {
                         name: deviceInfo.cpNewName,
                         sex: sex,
                         care_by: member._id,
                         birthYear: birthYear,
                         bedMonitorId: device._id,
                         tenantId: tenantId
                     });
                     var setUserConcernPersonJson = {
                         sessionId: session_id,
                         cpNewName: deviceInfo.cpNewName,
                         cpNewAge: Math.round(Math.random() * 120),
                         cpNewGender: cpNewGender,
                         operation: deviceInfo.operator
                     };
                     setUserConcernPersonJson = JSON.stringify(setUserConcernPersonJson);
                     var cpInfo = {
                         setUserConcernPersonJson: setUserConcernPersonJson
                     };
                     var retCp = yield self.updateConcernPerson(cpInfo);//第三方 add user concern person
                     var retDev = {
                         deviceId: device.name,
                         carePersonName: carePerson.name
                     }
                     return retDev;
                 }

                 devInfo = {
                     devId: deviceInfo.devId,
                     name: "睡眠监测仪"
                 };
                 devInfo = JSON.stringify(devInfo);
                 var sendData = {
                     sessionId: session_id,
                     type: deviceInfo.type,
                     operator: deviceInfo.operator,
                     device: devInfo
                 };
                 var retDevice = yield self.updateDevice(sendData);//第三方 add device

                 var setUserConcernPersonJson = {
                     sessionId: session_id,
                     cpNewName: deviceInfo.cpNewName,
                     cpNewAge: Math.round(Math.random() * 120),
                     cpNewGender: cpNewGender,
                     operation: deviceInfo.operator
                 };
                 setUserConcernPersonJson = JSON.stringify(setUserConcernPersonJson);
                 var cpInfo = {
                     setUserConcernPersonJson: setUserConcernPersonJson
                 };
                 var retCp = yield self.updateConcernPerson(cpInfo);//第三方 add user concern person

                 device = yield self.ctx.modelFactory().model_create(self.ctx.models['pub_bedMonitor'], {
                     code: deviceInfo.deviceMac,
                     name: deviceInfo.devId,
                     tenantId: tenantId
                 });
                 member = yield self.ctx.modelFactory().model_one(self.ctx.models['het_member'], {
                     where: {
                         open_id: session.openid
                     }
                 });
                 member.bindingBedMonitors = device._id;
                 yield member.save();
                 carePerson = yield self.ctx.modelFactory().model_create(self.ctx.models['het_memberCarePerson'], {
                     name: deviceInfo.cpNewName,
                     sex: sex,
                     care_by: member._id,
                     birthYear: birthYear,
                     bedMonitorId: device._id,
                     tenantId: tenantId
                 });
                 var ret = {
                     deviceId: device.name,
                     carePersonName: carePerson.name
                 }
                 return ret;
             }
             catch (e) {
                 console.log(e);
                 self.logger.error(e.message);
             }
         }).catch(self.ctx.coOnError);
     },

     getToken: function (uniqueId) {
         var self = this;
         return co(function *() {
             try {
                 console.log(uniqueId);
                 var ret = yield rp({
                     url: externalSystemConfig.bed_monitor_provider.api_url + '/ECSServer/userws/getToken.json?uniqueId=' + uniqueId,
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

     userAuthenticate: function (member, token) {
         var self = this;
         return co(function*() {
             try {
                 var ret = yield rp({
                     method: 'POST',
                     url: externalSystemConfig.bed_monitor_provider.api_url + '/ECSServer/userws/userAuthenticate.json',
                     form: {
                         token: token,
                         userName: member.name,
                         encryptedName: member.name,
                         encryptedPwd: member.passhash,
                         userType: "zjwsy"
                     }
                 });
                 ret = JSON.parse(ret);
                 if (ret.retCode == 'success') {
                     self.setSession(member.open_id, ret.retValue.sessionId);
                     return ret.retValue;
                 } else {
                     return self.ctx.wrapper.res.default();
                 }
             }
             catch (e) {
                 console.log(e);
                 self.logger.error(e.message);
             }

         }).catch(self.ctx.coOnError);

     },

     updateDevice: function (sendData, tryTimes) {
         var self = this;
         tryTimes = tryTimes === undefined ? 1 : tryTimes;
         return co(function*() {
             try {
                 console.log(sendData);
                 var ret = yield rp({
                     method: 'POST',
                     url: externalSystemConfig.bed_monitor_provider.api_url + '/ECSServer/devicews/updateDevice',
                     form: sendData
                 });
                 ret = JSON.parse(ret);
                 console.log(ret.retValue);
                 if (ret.retValue == "0x8005") {
                     console.log(ret.retValue);
                     console.log(sendData.openId);
                     var sessionId = yield self.login(sendData.openId);
                     sendData.sessionId = sessionId;
                     console.log(sendData);
                     if (tryTimes === 0) {
                         return self.ctx.wrapper.res.error({message: 'sessionId overdue'});
                     } else {
                         return self.updateDevice(sendData, 0);
                     }
                 }
                 console.log(ret);
                 return self.ctx.wrapper.res.default();
             }
             catch (e) {
                 console.log(e);
                 self.logger.error(e.message);
             }

         }).catch(self.ctx.coOnError);

     },
     updateConcernPerson: function (sendData, tryTimes) {
         var self = this;
         tryTimes = tryTimes === undefined ? 1 : tryTimes;
         return co(function*() {
             try {
                 var ret = yield rp({
                     method: 'POST',
                     url: externalSystemConfig.bed_monitor_provider.api_url + '/ECSServer/cpws/updateConcernPerson.json',
                     form: sendData
                 });
                 ret = JSON.parse(ret);
                 if (ret.retValue == "0x8005") {
                     var sessionId = yield self.login(sendData.openId);
                     var setUserConcernPersonJson = JSON.parse(sendData.setUserConcernPersonJson);
                     setUserConcernPersonJson.sessionId = sessionId;
                     sendData.setUserConcernPersonJson = JSON.stringify(setUserConcernPersonJson);
                     if (tryTimes === 0) {
                         return self.ctx.wrapper.res.error({message: 'sessionId overdue'});
                     } else {
                         return self.updateConcernPerson(sendData, 0);
                     }
                 }
                 console.log(ret);
                 return self.ctx.wrapper.res.default();
             }
             catch (e) {
                 console.log(e);
                 self.logger.error(e.message);
             }

         }).catch(self.ctx.coOnError);

     },

     updateDeviceAttachState: function (sendData) {
         var self = this;
         return co(function*() {
             try {
                 var ret = yield rp({
                     method: 'POST',
                     url: externalSystemConfig.bed_monitor_provider.api_url + '/ECSServer/devicews/updateDeviceAttachState',
                     form: sendData,
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
     autoRegistLogin: function () {
         var self = this;
         return co(function*() {
             try {

                 var tenants = yield self.ctx.modelFactory().model_query(self.ctx.models['pub_tenant'], {
                     select: 'name',
                     where: {
                         status: 1,
                         type: {'$in': ['A0001', 'A0002', 'A0003']},
                         active_flag: true,
                         certificate_flag: true,
                         validate_util: {"$gte": self.ctx.moment()}
                     }
                 });
                 for (var i = 0; i < tenants.length; i++) {
                     var session = {
                         openid: tenants[i]._id
                     };
                     var userInfo = {
                         nickName: tenants[i].name
                     };

                     yield self.ctx.modelFactory().model_one(self.ctx.models['het_member'], {
                         select: 'name',
                         where: {
                             status: 1,
                             type: {'$in': ['A0001', 'A0002', 'A0003']}
                         }
                     });

                     var member = yield self.regist(session, userInfo, tenants[i]._id);
                     if (member) {
                         var token = yield self.getToken(member.open_id);
                         var ret = yield self.userAuthenticate(member, token);
                         console.log('login success:', ret);
                     }
                 }
             }
             catch (e) {
                 console.log(e);
                 self.logger.error(e.message);
             }
         }).catch(self.ctx.coOnError);
     },
     UpdatebedMonitorInfo: function () { // modified by zppro 2017-3.31 
         var self = this;
         var timeout = 5 * 60 * 1000; // 离床5分钟报警
         var channelName = 'psn$bed_monitor';
         return co(function*() {
             try {
                 if (self.isExecuting) {
                     console.log('back');
                     return;
                 }
                 self.isExecuting = true;
                 var tenants = yield self.ctx.modelFactory().model_query(self.ctx.models['pub_tenant'], {
                     select: '_id name',
                     where: {
                         status: 1,
                         type: {'$in': [DIC.D1002.MINI_PENSION_ORG, DIC.D1002.MIDDLE_SIZE_PENSION_ORG, DIC.D1002.LARGE_SCALE_ORG]},
                         active_flag: true,
                         certificate_flag: true,
                         validate_util: {'$gte': self.ctx.moment()}
                     }
                 });

                 // console.log('保证各个tenant作为member的session ', tenants);
                 var tenantIds = self.ctx._.map(tenants, (o) => {
                     return o._id;
                 });
                 // 保证各个tenant作为member的session
                 for(var i=0,len=tenantIds.length;i<len;i++) {
                     tenantId = tenantIds[i];
                     var isRegist = yield self.checkIsRegist(tenantId);
                     if (!isRegist) {
                         yield self.regist(tenantId);
                     }
                     sessionId = yield self.getSession(tenantId);
                     var sessionIsExpired = yield self.checkSessionIsExpired(sessionId);
                     if (sessionIsExpired) {
                         yield self.login(tenantId);
                     }
                 }

                 var bedMonitors = yield self.ctx.modelFactory().model_query(self.ctx.models['pub_bedMonitor'], {
                     select: 'name tenantId device_status',
                     where: {
                         status: 1,
                         tenantId: {
                             '$in': tenantIds
                         }
                     }
                 });
                 // console.log('获取全部监控睡眠带 ', bedMonitors);
                 for (var i = 0; i < bedMonitors.length; i++) {
                     var bedMonitor = bedMonitors[i], key, oldBedStatus, bedStatus, sessionId;
                     console.log('>>>>> 睡眠带 ', bedMonitor.name);
                     key = bedMonitor.name;
                     var ret = yield self.getLatestSmbPerMinuteRecord(sessionId, bedMonitor.name);
                     var isOffLine = ret.retValue == 'device_offline';
                     console.log('当前状态:', isOffLine ? '离线':'在线');
                     if (isOffLine) {
                         if (bedMonitor.device_status != DIC.D3009.OffLine) {
                             bedMonitor.device_status = DIC.D3009.OffLine;
                             yield bedMonitor.save();
                             console.log('睡眠带状态变化 在线 -> 离线');
                             self.ctx.socket_service.sendToChannel(channelName, socketServerEvents.PSN.BED_MONITOR.OFF_LINE, {bedMonitorName: bedMonitor.name});
                         }
                     } else {
                         if (bedMonitor.device_status != DIC.D3009.OnLine) {
                             bedMonitor.device_status = DIC.D3009.OnLine;
                             yield bedMonitor.save();
                             console.log('睡眠带状态变化 离线 -> 在线');
                             self.ctx.socket_service.sendToChannel(channelName, socketServerEvents.PSN.BED_MONITOR.ON_LINE, {bedMonitorName: bedMonitor.name});
                         }
                         oldBedStatus = self.ctx.cache.get(key);
                         bedStatus = {
                             tenantId: bedMonitor.tenantId,
                             isBed: ret.retValue.inBed
                         };
                         if (!oldBedStatus) {
                             // 旧状态不存在,表示刚启动,或者刚报警
                             // 从当前开始计算离床时间
                             if (bedStatus.isBed) {
                                 console.log('系统启动或者刚报警 -> 在床 不做任何事情');
                                 self.ctx.cache.put(key, bedStatus);
                                 self.ctx.socket_service.sendToChannel(channelName, socketServerEvents.PSN.BED_MONITOR.COME, {bedMonitorName: bedMonitor.name});
                             } else {
                                 console.log('系统启动或者刚报警 -> 离床 重置报警');
                                 self.ctx.cache.put(key, bedStatus, timeout, function () {
                                     console.log('离床超过时限报警 睡眠带:', bedMonitor.name);
                                     self.ctx.socket_service.sendToChannel(channelName, socketServerEvents.PSN.BED_MONITOR.ALARM_LEAVE_TIMEOUT, {bedMonitorName: bedMonitor.name});
                                 });
                                 self.ctx.socket_service.sendToChannel(channelName, socketServerEvents.PSN.BED_MONITOR.LEAVE, {bedMonitorName: bedMonitor.name});
                             }
                         } else {
                             if (oldBedStatus.isBed == bedStatus.isBed) {
                                 if (bedStatus.isBed == true) {
                                     console.log('在床 -> 在床 不做任何事情');
                                 } else {
                                    // 离床 -> 离床 不做任何事情
                                     console.log('离床 -> 离床 处于离床计时,不做任何事情');
                                 }
                             } else {
                                 if (bedStatus.isBed == true) {
                                     console.log('离床 -> 在床 时限内回来了');
                                     self.ctx.cache.put(key, bedStatus);
                                     self.ctx.socket_service.sendToChannel(channelName, socketServerEvents.PSN.BED_MONITOR.COME, {bedMonitorName: bedMonitor.name});
                                 } else {
                                     console.log('在床 -> 离床 开始离床计时');
                                     self.ctx.cache.put(key, bedStatus, timeout, function (k, v) {
                                         console.log('离床超过时限报警 睡眠带:', bedMonitor.name);
                                         self.ctx.socket_service.sendToChannel(channelName, socketServerEvents.PSN.BED_MONITOR.ALARM_LEAVE_TIMEOUT, {bedMonitorName: bedMonitor.name});
                                     });
                                     self.ctx.socket_service.sendToChannel(channelName, socketServerEvents.PSN.BED_MONITOR.LEAVE, {bedMonitorName: bedMonitor.name});
                                 }
                             }
                         }
                         console.log('--------------------------');
                     }
                 }
                 self.isExecuting = false;
             }
             catch (e) {
                 console.log(e);
                 self.logger.error(e.message);
                 self.isExecuting = false;
             }
         }).catch(self.ctx.coOnError);
     },
     getLatestSmbPerMinuteRecord: function (sessionId, devId) {
         var self = this;
         return co(function*() {
             try {
                 var ret = yield rp({
                     method: 'POST',
                     url: externalSystemConfig.bed_monitor_provider.api_url + '/ECSServer/devicews/getLatestSmbPerMinuteRecord.json',
                     form: {sessionId: sessionId, devId: devId}
                 });
                 ret = JSON.parse(ret);
                 return ret;
             }
             catch (e) {
                 console.log(e);
                 self.logger.error(e.message);
             }

         }).catch(self.ctx.coOnError);
     }


 }
