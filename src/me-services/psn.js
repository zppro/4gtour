/**
 * Created by zppro on 17-4-7.
 * 养老平台移动接口 pension agency center
 */
var rp = require('request-promise-native');
var DIC = require('../pre-defined/dictionary-constants.json');
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
        }

        this.actions = [
            {
                method: 'workitem$fetch',
                verb: 'post',
                url: this.service_url_prefix + "/workitem/fetch",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var robot_code = this.robot_code  || 'not found';
                            console.log("robot_code:", robot_code);
                            self.logger.info("robot_code:" +  robot_code);
                            console.log("body:", this.request.body);
                            self.logger.info("body:" +  this.request.body);
                            this.body = app.wrapper.res.rows([]);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'workitem$checkin',
                verb: 'post',
                url: this.service_url_prefix + "/workitem/checkin",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var robot_code = this.robot_code  || 'not found';
                            console.log("robot_code:", robot_code);
                            self.logger.info("robot_code:" +  robot_code);
                            console.log("body:", this.request.body);
                            self.logger.info("body:" +  this.request.body);
                            this.body = app.wrapper.res.default();
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
//.init(option);