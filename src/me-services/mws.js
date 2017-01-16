/**
 * Created by zppro on 17-1-9.
 * 网上商城移动接口 related
 */
var rp = require('request-promise-native');
var DIC = require('../pre-defined/dictionary-constants.json');
var district = require('../pre-defined/district.json');
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
                method: 'shareProvinces',
                verb: 'get',
                url: this.service_url_prefix + "/share/provinces",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var provinces = app._.map(district, (o) => {
                                return {id: o._id,name: o.name}
                            })
                            this.body = app.wrapper.res.rows(provinces);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'shareCities',
                verb: 'get',
                url: this.service_url_prefix + "/share/cities/:provinceId",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var provinceId = this.params.provinceId;
                            var province = app._.find(district, (o) => {
                                return o._id == provinceId
                            });

                            if (!province) {
                                this.body = app.wrapper.res.rows([]);
                                yield next;
                                return;
                            }
                            var cities = app._.map(province.children, (o) => {
                                return {id: o._id,name: o.name}
                            })
                            this.body = app.wrapper.res.rows(cities);

                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'shareAreas',
                verb: 'get',
                url: this.service_url_prefix + "/share/areas/:provinceId,:cityId",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var provinceId = this.params.provinceId;
                            var province = app._.find(district, (o) => {
                                return o._id == provinceId
                            });
                            if (!province) {
                                this.body = app.wrapper.res.rows([]);
                                yield next;
                                return;
                            }

                            var cityId = this.params.cityId;
                            var city = app._.find(province.children, (o) => {
                                return o._id == cityId
                            });

                            if (!city) {
                                this.body = app.wrapper.res.rows([]);
                                yield next;
                                return;
                            }
                            var areas = app._.map(city.children, (o) => {
                                return {id: o._id,name: o.name}
                            })
                            this.body = app.wrapper.res.rows(areas);

                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'spus',
                verb: 'post',
                url: this.service_url_prefix + "/spus",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var where = {status: 1, cancel_flag: 0, tenantId: this.request.body.tenantId};
                            var rows = yield app.modelFactory().model_query(app.models['mws_spu'], {
                                    where: where,
                                    select: 'name imgs skus',
                                    sort: {name: 1}
                                },
                                {limit: this.request.body.page.size, skip: this.request.body.page.skip});

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
                method: 'orders',
                verb: 'post',
                url: this.service_url_prefix + "/orders",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var where = {status: 1, open_id: this.request.body.open_id, tenantId: this.request.body.tenantId};
                            console.log(where);
                            var orderStatus = this.request.body.order_status;
                            if (orderStatus) {
                                if (orderStatus.indexOf(',') != -1) {
                                    where.order_status = { $in : orderStatus.split(',')}
                                } else {
                                    where.order_status = orderStatus;
                                }
                            }
                            var rows = yield app.modelFactory().model_query(app.models['mws_order'], {
                                    where: where,
                                    select: 'code order_status amount items',
                                    sort: {check_in_time: -1}
                                },
                                {limit: this.request.body.page.size, skip: this.request.body.page.skip});

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
                method: 'order',
                verb: 'get',
                url: this.service_url_prefix + "/order/:orderId",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var order = yield app.modelFactory().model_read(app.models['mws_order'], this.params.orderId);
                            this.body = app.wrapper.res.ret(order);
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
            },
            {
                method: 'shippings',
                verb: 'post',
                url: this.service_url_prefix + "/shippings",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var where = {status: 1, open_id: this.request.body.open_id, tenantId: this.request.body.tenantId};
                            var rows = yield app.modelFactory().model_query(app.models['mws_shipping'], {
                                    where: where,
                                    select: 'shipping_nickname shipping_phone province city area address default_flag',
                                    sort: {default_flag: -1, operated_on: -1, check_in_time: -1 }
                                },
                                {limit: this.request.body.page.size, skip: this.request.body.page.skip});

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
                method: 'shipping',
                verb: 'get',
                url: this.service_url_prefix + "/shipping/:shippingId",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var shipping = yield app.modelFactory().model_read(app.models['mws_shipping'], this.params.shippingId);
                            this.body = app.wrapper.res.ret(shipping);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'shippingCreate',
                verb: 'post',
                url: this.service_url_prefix + "/shipping",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            // console.log(this.req);
                            if (this.request.body.default_flag) {
                                var defaultShipping = yield app.modelFactory().model_one(app.models['mws_shipping'], {where: {tenantId: this.request.body.tenantId, open_id: this.request.body.open_id, default_flag: true}});
                                if (defaultShipping) {
                                    defaultShipping.default_flag = false;
                                    yield defaultShipping.save();
                                }
                            }
                            var created = yield app.modelFactory().model_create(app.models['mws_shipping'], this.request.body);
                            this.body = app.wrapper.res.ret(created);
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
                method: 'shippingUpdate',
                verb: 'put',
                url: this.service_url_prefix + "/shipping/:shippingId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            if (this.request.body.default_flag) {
                                var defaultShipping = yield app.modelFactory().model_one(app.models['mws_shipping'], {where: {tenantId: this.request.body.tenantId, open_id: this.request.body.open_id, default_flag: true}});
                                if (defaultShipping) {
                                    defaultShipping.default_flag = false;
                                    yield defaultShipping.save();
                                }
                            }
                            yield app.modelFactory().model_update(app.models['mws_shipping'], this.params.shippingId, this.request.body);
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
                method: 'shippingSetDefault',
                verb: 'put',
                url: this.service_url_prefix + "/shippingSetDefault/:shippingId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var shipping = yield app.modelFactory().model_read(app.models['mws_shipping'], this.params.shippingId);

                            var defaultShipping = yield app.modelFactory().model_one(app.models['mws_shipping'], {where: {tenantId: shipping.tenantId, open_id: shipping.open_id, default_flag: true}});
                            if (defaultShipping) {
                                defaultShipping.default_flag = false;
                                yield defaultShipping.save();
                            }
                            shipping.default_flag = true;
                            yield shipping.save();
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