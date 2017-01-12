/**
 * Created by zppro on 17-1-12.
 */
var co = require('co');
var rp = require('request-promise-native');
var weixinConfig = require('../pre-defined/weixin-config.json');
var Hashes = require('jshashes');
var xml2js = require('xml2js');
var md5 = require('md5')
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

        this.CACHE_MODULE = 'WX-APP-';
        this.CACHE_ITEM_SESSION = 'SESSION';
        // this.ensureAccessToken();
        // debug: vGrveUaIbvYzYUaAPDeAPWEFNBIXYyOq8S2X0tS6xff0FeonqcmXE75HwlLavGsKmBL05UZ1GBwljLvYwlKt8WLI2XiYXK_oD4AK_tUcWhkYMNiAGANBC
        this.dl$xml2js = this.ctx.wrapper.cb(xml2js.parseString);
        console.log(this.filename + ' ready... ');
        return this;
    },
    getSession: function (gen_session_key) {
        var key = this.CACHE_MODULE + this.CACHE_ITEM_SESSION + '@' + gen_session_key;
        return this.ctx.cache.get(key);
    },
    genSessionKey: function (appid, code) {
        var self = this;
        return co(function *() {
            try {
                var config = yield self.getConfig(appid);
                console.log(self.CACHE_MODULE);
                var ret = yield rp({
                    url: 'https://api.weixin.qq.com/sns/jscode2session?appid=' + config.appid + '&secret=' + config.secret + '&js_code=' + code + '&grant_type=authorization_code',
                    json: true
                });
                console.log(ret);
                var new_gen_session_key;
                if (ret.session_key) {
                    new_gen_session_key  = require('child_process').execSync('head -n 80 /dev/urandom | tr -dc A-Za-z0-9 | head -c 168').toString();
                    var key = self.CACHE_MODULE + self.CACHE_ITEM_SESSION + '@' + new_gen_session_key;
                    self.ctx.cache.put(key, ret, ret.expires_in);

                } else {
                    self.logger.error(JSON.stringify(ret));
                }
                return new_gen_session_key;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    unifiedorder: function (appid, openid, payer_ip, orderid, trade_detail, out_trade_no, total_fee, trade_time_start, trade_time_expire) {
        var self = this;
        return co(function *() {
            try {
                var config = yield self.getConfig(appid);
                if (!config) return self.ctx.wrapper.res.error({code: 53999 ,message: 'invalid appid' }); //无效的appid

                var builder = new xml2js.Builder({
                    allowSurrogateChars: true
                });

                var sendObject = {
                    appid: config.appid,
                    mch_id: config.mch_id,
                    nonce_str: self.createNonceStr(),
                    body: config.trade_des,
                    detail: '<![CDATA[' + JSON.stringify(trade_detail) + ']]>',
                    out_trade_no: out_trade_no,
                    total_fee: total_fee,
                    spbill_create_ip: payer_ip,
                    time_start: trade_time_start,
                    time_expire: trade_time_expire,
                    notify_url: config.notify_url,
                    trade_type: 'JSAPI',
                    openid: openid
                }
                var sign = self.createSignature(sendObject, config.mch_api_secret);
                sendObject['sign'] = sign;
                var body =  builder.buildObject({
                    xml:sendObject
                });

                // console.log(body);

                var rawRet = yield rp({
                    method: 'POST',
                    url: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
                    headers: { 'Content-Type':'text/xml; charset=utf-8' },
                    body: body
                });
                var ret = (yield self.dl$xml2js(rawRet, {
                    explicitArray: false,
                    ignoreAttrs: true
                })).xml;

                // console.log(ret);

                if (ret.return_code != 'SUCCESS') {
                    return self.ctx.wrapper.res.error({code: 53998 ,message: ret.return_msg });
                }
                if (ret.result_code != 'SUCCESS' ) {
                    return self.ctx.wrapper.res.error({code: 53997 ,message: ret.err_code });
                }

                // 开始构建wx.requestPayment 参数
                var requestPaymentObject = {
                    timeStamp: self.createTimeStamp(),
                    nonceStr: self.createNonceStr(),
                    package: 'prepay_id=' + ret.prepay_id,
                    signType: 'MD5'
                }
                var paySign = self.createSignature(requestPaymentObject, config.mch_api_secret);
                // console.log(paySign);
                requestPaymentObject['paySign'] = paySign;
                return self.ctx.wrapper.res.ret({
                    orderId: orderid,
                    requestPaymentObject: requestPaymentObject
                });
                
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    validateNotifyData: function (notifyData) {
        var self = this;
        return co(function *() {
            try {
                var signKeys = [];
                for(var key in  notifyData) {
                    if (self.ctx._.isArray(notifyData[key])) {
                        notifyData[key] = notifyData[key][0];
                    }
                    if (key != 'sign' && notifyData[key] != '' && notifyData[key] != undefined) {
                        signKeys.push(key);
                    }
                }
                var config = yield self.getConfig(notifyData.appid);
                if (!config) return false; //无效的appid
                if (config.mch_id != notifyData.mch_id) return false; //无效的商户
                signKeys.sort();
                var stringA = self.ctx._.map(signKeys, function(key) {
                    return key + '=' + notifyData[key]
                }).join('&');

                var stringSignTemp = stringA + "&key=" + config.mch_api_secret;
                var genSign;
                if (notifyData['sign_type'] == 'HMAC-SHA256') {
                    console.log('HMAC-SHA256');
                    var SHA256 = new Hashes.SHA256;
                    genSign = SHA256.b64_hmac(stringSignTemp).toUpperCase();
                } else {
                    console.log('MD5');
                    genSign =  md5(stringSignTemp).toUpperCase();
                }

                return genSign == notifyData['sign'];
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
    createSignature: function (signObject, mch_api_secret) {
        var signKeys = [];
        for(var key in  signObject) {
            if (key != 'sign' && signObject[key] != '' && signObject[key] != undefined) {
                signKeys.push(key);
            }
        }
        signKeys.sort();
        var stringA = this.ctx._.map(signKeys, function(key) {
            return key + '=' + signObject[key]
        }).join('&');

        // console.log('stringA:');
        // console.log(stringA);

        var stringSignTemp = stringA + "&key=" + mch_api_secret;
        // console.log('stringSignTemp:');
        // console.log(stringSignTemp);
        var genSign;
        if (signObject['sign_type'] == 'HMAC-SHA256') {
            console.log('HMAC-SHA256');
            var SHA256 = new Hashes.SHA256;
            genSign = SHA256.b64_hmac(stringSignTemp).toUpperCase();
        } else {
            console.log('MD5');
            genSign =  md5(stringSignTemp).toUpperCase();
        }
        return genSign;
    },
    getConfig: function(appId) {
        var self = this;
        return co(function *() {
            try {
                console.log(appId)
                var appConfig = self.ctx._.find(weixinConfig.apps, function(o){
                    return o.appid == appId;
                });
                if (!appConfig) {
                    throw 'not find app for appid:' + appId;
                }
                return appConfig;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    }
};