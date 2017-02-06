/**
 * Created by zppro on 16-11-8.
 */
var co = require('co');
var rp = require('request-promise-native');
var weixinConfig = require('../pre-defined/weixin-config.json');
var utils = require('../libs/Utils')

module.exports = {
    init: function (ctx) {
        console.log('init mobile_site_weixin... ');
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
    requestAccessToken : function (code) {
        var self = this;
        return co(function *() {
            try {
                var success = true;
                var ret = yield rp({
                    url: 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + weixinConfig.open_mobile_site.appid + '&secret=' + weixinConfig.open_mobile_site.secret + '&code=' + code + '&grant_type=authorization_code',
                    json: true
                });
                console.log('getAccessTokenData:');
                console.log(ret);
                if (!ret.access_token) {
                    success = false;
                    self.logger.error(ret);
                }
                return {success: success, data: utils.formatWeiXinResult(ret)};
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    refreshAccessToken: function (refresh_token) {
        var self = this;
        return co(function *() {
            try {
                var success = true;
                var ret = yield rp({
                    url: 'https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=' + weixinConfig.open_mobile_site.appid + '&refresh_token=' + refresh_token + '&grant_type=refresh_token',
                    json: true
                });
                console.log('refreshAccessTokenData:');
                console.log(ret);
                if (!ret.access_token) {
                    success = false;
                    self.logger.error(ret);
                }
                return {success: success, data: utils.formatWeiXinResult(ret)};
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    getUserInfoByAuthCode: function (access_token, openid) {
        var self = this;
        return co(function *() {
            try {
                var success = true;
                var ret = yield rp({
                    url: 'https://api.weixin.qq.com/sns/userinfo?access_token=' + access_token + '&openid=' + openid,
                    json: true
                });

                console.log('refreshAccessToken:');
                console.log(ret);
                if (!ret.openid) {
                    success = false;
                    self.logger.error(ret);
                }
                return {success: success, data: utils.formatWeiXinResult(ret)};
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    }
};