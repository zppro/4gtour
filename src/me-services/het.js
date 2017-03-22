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
                        var member = yield app.bed_monitor_provider.regist(this.request.body.session,this.request.body.userInfo);
                        console.log("regist reback");
                        if(member){
                            console.log("getToken");
                            var token = yield app.nursing_bed_monitor_provider.getToken(member.open_id);
                            var ret= yield app.nursing_bed_monitor_provider.userAuthenticate(member,token);
                            var session_id = yield app.nursing_bed_monitor_provider.getSession(member.open_id)
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
                  this.body = yield app.bed_monitor_provider.addDevice(this.request.body);
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
