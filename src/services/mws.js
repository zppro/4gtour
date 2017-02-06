/**
 * idt Created by zppro on 17-1-16.
 * 网上商城web接口
 */
var DIC = require('../pre-defined/dictionary-constants.json');
var rq = require('request');
var fs = require('fs-extra');
module.exports = {
    init: function (option) {
        var self = this;
        this.file = __filename;
        this.filename = this.file.substr(this.file.lastIndexOf('/') + 1);
        this.module_name = this.filename.substr(0, this.filename.lastIndexOf('.'));
        this.service_url_prefix = '/services/' + this.module_name.split('_').join('/');
        this.log_name = 'svc_' + this.filename;
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
                method: 'orderShip',
                verb: 'post',
                url: this.service_url_prefix + "/order/ship/:orderId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var shipInfo = app._.extend({
                                order_status: DIC.MWS01.SHIPPING,
                                logistics_time: app.moment()
                            }, this.request.body);
                            //console.log(shipInfo);
                            var updated = yield app.modelFactory().model_update(app.models['mws_order'], this.params.orderId, shipInfo);
                            var order = yield app.modelFactory().model_read(app.models['mws_order'], this.params.orderId);
                            var sendData = {
                                "page": '/pages/mine/order-details?orderId=' + order.id,
                                "data": {
                                    "keyword1": {
                                        "value": order.code,
                                        "color": "#ccc"
                                    },
                                    "keyword2": {
                                        "value": order.items[0].spu_name,
                                        "color": "#ccc"
                                    },
                                    "keyword3": {
                                        "value": order.logistics_code,
                                        "color": "#000"
                                    },
                                    "keyword4": {
                                        "value": order.logistics_company,
                                        "color": "#000"
                                    },
                                    "keyword5": {
                                        "value": app.moment(order.logistics_time).format('YYYY年MM月DD日'),
                                        "color": "#ccc"
                                    }
                                }
                                ,emphasis_keyword: "keyword3.DATA"
                            }

                            var wrapperResult = yield app.app_weixin.sendTemplateMessage('OrderShipped', order.open_id, order.tenantId, sendData);
               
                            this.body = wrapperResult;
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'spuPublish',
                verb: 'post',
                url: this.service_url_prefix + "/spu/publish/:spuId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            yield app.modelFactory().model_update(app.models['mws_spu'], this.params.spuId, {publish_flag: true});
                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'spuUnpublish',
                verb: 'post',
                url: this.service_url_prefix + "/spu/unpublish/:spuId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            yield app.modelFactory().model_update(app.models['mws_spu'], this.params.spuId, {publish_flag: false});
                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'afterSaleAccept',
                verb: 'post',
                url: this.service_url_prefix + "/afterSale/accept/:afterSaleId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var acceptData = {biz_status: DIC.MWS05.ACCEPTED, audit_on: app.moment()};
                            yield app.modelFactory().model_update(app.models['mws_afterSale'], this.params.afterSaleId, acceptData);
                            this.body = app.wrapper.res.ret(acceptData);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'genWXAQRCode',
                verb: 'post',
                url: this.service_url_prefix + "/channelUnit/genWXAQRCode/:channelUnitId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var channelUnit = yield app.modelFactory().model_read(app.models['mws_channelUnit'], this.params.channelUnitId);
                            if (!channelUnit) {
                                this.body = app.wrapper.res.error({code: 53001 ,message: 'invalid channelUnitId' });
                                yield next;
                                return;
                            }
                            channelUnit.wxa_url =  this.request.body.wxa_url;
                            channelUnit.wxa_qrcode_width = this.request.body.wxa_qrcode_width;

                            var wxAppConfig = yield app.modelFactory().model_one(app.models['mws_wxAppConfig'], {where: {status: 1, tenantId:channelUnit.tenantId}, select:'app_id'});

                            var accessTokenWrapper = yield app.app_weixin.requestAccessToken(wxAppConfig.app_id);
                            if (!accessTokenWrapper.success) {
                                this.body = accessTokenWrapper;
                                yield next;
                                return;
                            }
                            var url = 'https://api.weixin.qq.com/cgi-bin/wxaapp/createwxaqrcode?access_token=' + accessTokenWrapper.ret;
                            var file = 'channelUnit-' + this.params.channelUnitId + '.jpg';
                            var downloadPromise = new Promise(function (resolve, reject) {
                                var stream  = rq({
                                    method: 'POST',
                                    url: url,
                                    body: {path: channelUnit.wxa_url, width: channelUnit.wxa_qrcode_width},
                                    json: true
                                }).pipe(fs.createWriteStream(file));
                                stream.on('finish', function () { 
                                    resolve();
                                });
                            });
                            yield downloadPromise;

                            var retWrapper = yield app.open_qiniu.upload(file, true);
                            if (retWrapper.success) {
                                channelUnit.wxa_qrcode = retWrapper.ret;
                                yield channelUnit.save();
                            }
                            this.body = retWrapper;
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'accessTokens',
                verb: 'get',
                url: this.service_url_prefix + "/accessTokens/:tenantId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var tenantId = this.params.tenantId;
                            var wxConfigs = yield app.modelFactory().model_query(app.models['mws_wxAppConfig'], { where:{tenantId: tenantId}});
                            if (wxConfigs.length === 0) return app.wrapper.res.error({code: 53994 ,message: 'not found appid for the tenant:' + tenantId });
                            //app.cache.get(cach

                            var prefix = app.app_weixin.CACHE_MODULE + app.app_weixin.CACHE_ITEM_ACCESS_TOKEN + '@';

                            var rows = app._.map(wxConfigs, (o) => {
                                var key = prefix + o.app_id;
                               return app._.extend(app._.pick(o,['app_id', 'app_name']),{access_token: app.cache.get(key)});
                            });
                            console.log(rows);
                            this.body = app.wrapper.res.rows(rows);
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
                verb: 'post',
                url: this.service_url_prefix + "/requestAccessToken",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            this.body = yield app.app_weixin.requestAccessToken(this.request.body.appid)
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