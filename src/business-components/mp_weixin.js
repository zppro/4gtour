/**
 * Created by zppro on 16-11-8.
 */
var co = require('co');
var rp = require('request-promise-native');
var weixinConfig = require('../pre-defined/weixin-config.json');


module.exports = {
    init: function (ctx) {
        console.log('init weixin... ');
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

        this.CACHE_MODULE = 'WX-MP-';
        this.CACHE_ITEM_ACCESS_TOKEN = 'access_token';
        this.CACHE_ITEM_TICKET = 'jsapi_ticket';
        this.CACHE_ITEM_SIGNATURE = 'createSignature';
        this.CACHE_ITEM_CONFIG = 'Config';
        // this.ensureAccessToken();
        // debug: vGrveUaIbvYzYUaAPDeAPWEFNBIXYyOq8S2X0tS6xff0FeonqcmXE75HwlLavGsKmBL05UZ1GBwljLvYwlKt8WLI2XiYXK_oD4AK_tUcWhkYMNiAGANBC

        console.log(this.filename + ' ready... ');
        return this;
    },
    refreshAccessToken: function () {
        var self = this;
        return co(function *() {
            try {
                var _access_token;
                var ret = yield rp({
                    url: 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + weixinConfig.open_web_site.appid + '&secret=' + weixinConfig.open_web_site.secret,
                    json: true
                });

                console.log(ret);
                if (ret.access_token) {
                    self.logger.info('get access token : ' + ret.access_token);
                    _access_token = ret.access_token;
                    this.accessTokenExpiresIn = ret.expires_in;
                    this.ctx.cache.put(this.CACHE_MODULE + this.CACHE_ITEM_ACCESS_TOKEN, _access_token, this.accessTokenExpiresIn, function (key, value) {
                        self.refreshAccessToken()
                    });
                } else {
                    self.logger.error(JSON.stringify(ret));
                }

                return _access_token;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    createTicket: function (access_token) {
        var self = this;
        return co(function *() {
            try {
                var _ticket;
                var ret = yield rp({
                    url: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + access_token + '&type=jsapi',
                    json: true
                });
                if (ret.errcode == 0) {
                    self.logger.info('get ticket : ' + ret.ticket);
                    _ticket = ret.ticket;
                } else {
                    self.logger.error(ret.errcode + ":" + ret.errmsg)
                }
                return _ticket;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    createNonceStr: function() {
        return Math.random().toString(36).substr(2, 15);
    },
    createTimeStamp : function () {
        return parseInt(new Date().getTime() / 1000) + '';
    },
    createSignature: function (jsapi_ticket,noncestr,timestamp,url) {

        var str = 'jsapi_ticket=' + ticket + '&noncestr=' + noncestr + '&timestamp=' + timestamp + '&url=' + url;

        var shaObj = new jsSHA("SHA-1", "TEXT");
        shaObj.update(str);
        return shaObj.getHash("HEX");
    },
    createWXConfig: function(url) {
        var self = this;
        return co(function *() {
            try {
                console.log(self.ctx.cache);
                var access_token = self.ctx.cache.get(this.CACHE_MODULE + this.CACHE_ITEM_ACCESS_TOKEN);
                if(!access_token)
                    yield this.refreshAccessToken();

                var config = self.ctx.cache.get(this.CACHE_MODULE + this.CACHE_ITEM_CONFIG + '@' + url);

                if (!config) {
                    access_token = self.ctx.cache.get(this.CACHE_MODULE + this.CACHE_ITEM_ACCESS_TOKEN);
                    var jsapi_ticket = this.createTicket(access_token);
                    var noncestr = this.createNonceStr();
                    var timestamp = this.createTimeStamp();
                    var jsapi_signature = this.createSignature(jsapi_ticket, noncestr, timestamp, url);

                    config = {appId: weixinConfig.open_web_site.appid, noncestr: noncestr, timestamp: timestamp, signature: jsapi_signature}
                }
                return config;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    }
};