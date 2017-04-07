/**
 * Created by hcl on 17-3-14.
 */
 module.exports = {
    init: function (option) {
        var self = this;
        this.file = __filename;
        this.filename = this.file.substr(this.file.lastIndexOf('/') + 1);
        this.module_name = this.filename.substr(0, this.filename.lastIndexOf('.'));
        this.service_url_prefix = '/me-services/' + this.module_name.split('_').join('/');
        this.log_name = 'svc_' + this.filename;
        option = option || {};
        this.logger = require('log4js').getLogger(this.log_name);
        if (!this.logger) {
            console.error('logger not loaded in ' + this.file);
        }
        else {
            this.logger.info(this.file + " loaded!");
        }

        this.actions=[
        {
            method: 'sleepUser$regist',//regist useing
            verb: 'post',
            url: this.service_url_prefix + "/sleepUser$regist",
            handler: function (app, options) {
                return function *(next) {
                    try {
                        var member = yield app.bed_monitor_provider.regist(this.request.body.session,this.request.body.userInfo,this.request.body.tenantId);
                        console.log("regist reback");
                        if(member){
                            console.log("getToken");
                            var token = yield app.bed_monitor_provider.getToken(member.open_id);
                            var ret= yield app.bed_monitor_provider.userAuthenticate(member,token);
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
                      var ret = yield app.bed_monitor_provider.addDevice(this.request.body.deviceInfo,this.request.body.session,this.request.body.tenantId);
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
              console.log(this.request.body)
            var ret = yield app.bed_monitor_provider.getDeviceInfo(this.request.body.session.openid);
              console.log("ret++++:",ret);
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
    method: 'sleepDevicews$removeDevice',
    verb: 'post',
    url: this.service_url_prefix + "/sleepDevicews$removeDevice",
    handler: function (app, options) {
        return function *(next) {
           try {
              console.log("body:");
              console.log(this.request.body)
            var ret = yield app.bed_monitor_provider.removeDevice(this.request.body.session.openid,this.request.body.deviceId,this.request.body.tenantId);
              console.log("ret++++:",ret);
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
            var ret = yield app.bed_monitor_provider.getDeviceDetails(this.request.body.session.openid,this.request.body.devId,this.request.body.tenantId);
              console.log("ret++++:",ret);
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
            var ret = yield app.bed_monitor_provider.changeDeviceInfo(this.request.body.session.openid,this.request.body.deviceInfo,this.request.body.tenantId);
              console.log("ret++++:",ret);
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
             var ret = yield app.bed_monitor_provider.checkIsAttach(this.request.body.session.openid,this.request.body.deviceId,this.request.body.tenantId);
              console.log("isAttach:",ret);
              this.body = ret;
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
              yield app.bed_monitor_provider.getSleepBriefReport();
              this.body = "ok";
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
