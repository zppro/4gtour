/**
 * Created by zppro on 16-11-11.
 * weixin open platform for mobile web app
 */
var rp = require('request-promise-native');
var weixinConfig = require('../pre-defined/weixin-config.json');

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
                method: 'getOpenWeiXinConfig',
                verb: 'get',
                url: this.service_url_prefix + "/getOpenWeiXinConfig",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            this.body = app.wrapper.res.ret(weixinConfig.open_mobile_site);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'requestAccessToken',
                verb: 'get',
                url: this.service_url_prefix + "/requestAccessToken/:code",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var ret = yield app.mobile_site_weixin.requestAccessToken(this.params.code);
                            if (ret.success) {
                                console.log(ret.data)
                                this.body = app.wrapper.res.ret(ret.data);
                            } else {
                                this.body = app.wrapper.res.error(ret.data);
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
                method: 'refreshAccessToken',
                verb: 'get',
                url: this.service_url_prefix + "/refreshAccessToken/:refresh_token",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var ret = yield app.mobile_site_weixin.refreshAccessToken(this.params.refresh_token);
                            if (ret.success) {
                                this.body = app.wrapper.res.ret(ret.data);
                            } else {
                                this.body = app.wrapper.res.error(ret.data);
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
                method: 'getUserInfo',
                verb: 'get',
                url: this.service_url_prefix + "/getUserInfo/:access_token,:openid",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var ret = yield app.mobile_site_weixin.getUserInfoByAuthCode(this.params.access_token, this.params.openid);
                            if (ret.success) {
                                this.body = app.wrapper.res.ret(ret.data);
                            } else {
                                this.body = app.wrapper.res.error(ret.data);
                            }
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