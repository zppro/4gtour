/**
 * idt Created by zppro on 17-1-16.
 * 网上商城web接口
 */
var DIC = require('../pre-defined/dictionary-constants.json');
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
                method: 'accessTokens',
                verb: 'get',
                url: this.service_url_prefix + "/accessTokens",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            //app.cache.get(cach
                            var keys = app.cache.keys();
                            var prefix = app.app_weixin.CACHE_MODULE + app.app_weixin.CACHE_ITEM_ACCESS_TOKEN + '@';
                            console.log(prefix);
                            var rows = [];
                            var accessTokenCacheKeys = app._.filter(keys,(o) => {
                                console.log(o);
                                console.log(o.indexOf(prefix));
                                return o.indexOf(prefix) == 0
                            });

                            if(accessTokenCacheKeys.length > 0){
                                app._.each(accessTokenCacheKeys, (k) => {
                                  rows.push({key:k, value: app.cache.get(k)})
                                })
                            }

                            this.body = app.wrapper.res.rows(rows);
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