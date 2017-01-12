/**
 * Created by zppro on 17-1-9.
 * travel related
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
                method: 'spus',
                verb: 'post',
                url: this.service_url_prefix + "/spus",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var where = {status: 1, cancel_flag: 0};
                            var rows = yield app.modelFactory().model_query(app.models['mws_spu'], {
                                    where: where,
                                    select: 'name imgs skus',
                                    sort: {name: 1}
                                },
                                {limit: this.request.body.page.size, skip: this.request.body.page.skip});
                            console.log(this.request.body);
 
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
                method: 'spu',
                verb: 'get',
                url: this.service_url_prefix + "/spu/:spuId",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var spu = yield app.modelFactory().model_read(app.models['mws_spu'], this.params.spuId);
                            this.body = app.wrapper.res.ret(spu);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'orderCreate',
                verb: 'post',
                url: this.service_url_prefix + "/order",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            // console.log(this.req);
                            var ip = this.request.headers["x-real-ip"] || this.request.headers("x-forwarded-for");
                            console.log('ip:' + ip);
                            var order = app._.extend({
                                order_status: DIC.MWS01.NOT_PAY
                            }, this.request.body);
                            order.trade_time_expire = app.moment().add(1, 'days');
                            order.ip = ip;
                            var spu = yield app.modelFactory().model_read(app.models['mws_spu'], order.items[0].spu_id);
                            order.tenantId = spu.tenantId;
                            var created = yield app.modelFactory().model_create(app.models['mws_order'], order);
                            
                            // 调用统一下单接口
                            var goods_detail = [];
                            for(var i=0;i<created.items.length;i++){
                                goods_detail.push({
                                    goods_id: created.items[i].sku_id,
                                    goods_name: created.items[i].sku_name,
                                    quantity : created.items[i].quantity,
                                    price: created.items[i].price * 100
                                })
                            }
                            if (created.shipping_fee > 0) {
                                goods_detail.push({
                                    goods_id: app.modelVariables.KEYS.SHIPPING_FEE,
                                    goods_name: app.modelVariables.KEYS.SHIPPING_FEE,
                                    quantity : 1,
                                    price: created.shipping_fee * 100
                                })
                            }
                            var trade_detail = {goods_detail:goods_detail};
                            var total_fee = created.amount* 100 + created.shipping_fee * 100;
                            var trade_time_start = app.moment(created.trade_time_start).format('YYYYMMDDHHmmss');
                            var trade_time_expire = app.moment(created.trade_time_expire).format('YYYYMMDDHHmmss');
                            console.log('orderid:' + created.id);
                            this.body = yield app.app_weixin.unifiedorder(this.request.body.appid, this.request.body.open_id, ip, created.id, trade_detail, created.code, total_fee, trade_time_start, trade_time_expire);
                            console.log(this.body);
                            //this.body = app.wrapper.res.ret(created);
                        } catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'orderPaySuccess',
                verb: 'put',
                url: this.service_url_prefix + "/orderPaySuccess/:orderId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var updateInfo = this.request.body;
                            updateInfo.order_status = DIC.MWS01.WAITING_SHIP;
                            updateInfo.pay_time = app.moment();
                            yield app.modelFactory().model_update(app.models['mws_order'], this.params.orderId, updateInfo);
                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'orderUpdate',
                verb: 'put',
                url: this.service_url_prefix + "/order/:orderId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            yield app.modelFactory().model_update(app.models['mws_order'], this.params.orderId, this.request.body);
                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            console.log(e);
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