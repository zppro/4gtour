/**
 * Created by zppro on 16-11-8.
 */
var co = require('co');
var rp = require('request-promise-native');
var weixinConfig = require('../pre-defined/weixin-config.json');


module.exports = {
    transporters : {},
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

        this.CACHE_MODULE = 'WX-MOBILE-SITE';
        this.CACHE_ITEM_ACCESS_TOKEN_DATA = 'access_token_data';
        this.CACHE_ITEM_CONFIG = 'UserInfo';

        console.log(this.filename + ' ready... ');

        return this;
    },
    getAccessToken : function (code) {
        var self = this;
        return co(function *() {
            try {
                var ret = yield rp({
                    url: 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + weixinConfig.open_mobile_site.appid + '&secret=' + weixinConfig.open_mobile_site.secret+'&code=' + code + '&grant_type=authorization_code',
                    json: true
                });
                console.log('getAccessToken:');
                console.log(ret);
                if (ret.access_token) {
                    self.accessTokenData = ret;
                    self.ctx.cache.put(self.CACHE_MODULE + self.CACHE_ITEM_ACCESS_TOKEN_DATA, self.accessTokenData, self.accessTokenData.expires_in - 59, function (key, value) {
                        self.refreshAccessToken()
                    });
                } else {
                    self.accessTokenData = null;
                    self.ctx.cache.del(self.CACHE_MODULE + self.CACHE_ITEM_ACCESS_TOKEN_DATA);
                    self.logger.error(JSON.stringify(ret));
                }

                return this.accessTokenData;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    refreshAccessToken: function () {
        var self = this;
        return co(function *() {
            try {
                if(self.accessTokenData && self.accessTokenData.refresh_token){
                    var ret = yield rp({
                        url: 'https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=' + weixinConfig.open_mobile_site.appid + '&refresh_token=' + this.accessTokenData.refresh_token + '&grant_type=refresh_token',
                        json: true
                    });
                    console.log('refreshAccessToken:');
                    console.log(ret);
                    if (ret.access_token) {
                        self.accessTokenData = ret;
                        self.ctx.cache.put(self.CACHE_MODULE + self.CACHE_ITEM_ACCESS_TOKEN_DATA, self.accessTokenData.access_token , self.accessTokenData.expires_in - 59, function (key, value) {
                            self.refreshAccessToken()
                        });
                    } else {
                        self.accessTokenData = null;
                        self.ctx.cache.del(self.CACHE_MODULE + self.CACHE_ITEM_ACCESS_TOKEN_DATA);
                        self.logger.error(JSON.stringify(ret));
                    }
                }
                return self.accessTokenData;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    getUserInfo: function () {
        var self = this;
        return co(function *() {
            try {
                var userInfo;
                if(!self.accessTokenData){
                    self.accessTokenData = self.ctx.cache.get(self.CACHE_MODULE + self.CACHE_ITEM_ACCESS_TOKEN_DATA);
                }
                if(!this.accessTokenData){
                    console.log(self.getAccessToken)
                    yield self.getAccessToken();
                }
                if(self.accessTokenData && self.accessTokenData.scope == 'snsapi_userinfo') {
                    var ret = yield rp({
                        url: 'https://api.weixin.qq.com/sns/userinfo?access_token=' + self.accessTokenData.access_token + '&openid=' + self.accessTokenData.openid,
                        json: true
                    });

                    console.log('refreshAccessToken:');
                    console.log(ret);
                    if (ret.openid) {
                        userInfo = ret;
                    }
                    else {
                        self.logger.error(ret);
                    }
                }
                return userInfo;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    }
};