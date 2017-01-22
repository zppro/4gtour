/**
 * Created by zppro on 17-1-11.
 * weixin open platform for mobile web app
 */
var xml2js = require('xml2js');
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
                method: 'wxAppConfig',
                verb: 'get',
                url: this.service_url_prefix + "/wxAppConfig/:wxAppConfigId",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var wxAppConfig = yield app.modelFactory().model_read(app.models['mws_wxAppConfig'], this.params.wxAppConfigId);
                            this.body = app.wrapper.res.ret(wxAppConfig);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'getSession',
                verb: 'get',
                url: this.service_url_prefix + "/getSession/:gen_session_key",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var session = app.app_weixin.getSession(this.params.gen_session_key);
                            this.body = app.wrapper.res.ret(session);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'requestSession',
                verb: 'post',
                url: this.service_url_prefix + "/requestSession",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var gen_session_key = yield app.app_weixin.genSessionKey(this.request.body.appid, this.request.body.code);
                            console.log(gen_session_key)
                            var session = yield app.app_weixin.getSession(gen_session_key);
                            console.log(gen_session_key);
                            console.log(session);
                            this.body = app.wrapper.res.ret({
                                session_key: gen_session_key,
                                session_value: session
                            });
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'prepay',
                verb: 'post',
                url: this.service_url_prefix + "/prepay/:orderId",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var order = yield app.modelFactory().model_read(app.models['mws_order'], this.params.orderId);
                            if (!order) {
                                this.body = app.wrapper.res.error({code: 51102, message: 'invalid order'});
                                yield next;
                                return;
                            }

                            var goods_detail = [];
                            for(var i=0;i<order.items.length;i++){
                                goods_detail.push({
                                    goods_id: order.items[i].sku_id,
                                    goods_name: order.items[i].sku_name,
                                    quantity : order.items[i].quantity,
                                    price: order.items[i].price * 100
                                })
                            }
                            if (order.shipping_fee > 0) {
                                goods_detail.push({
                                    goods_id: app.modelVariables.KEYS.SHIPPING_FEE,
                                    goods_name: app.modelVariables.KEYS.SHIPPING_FEE,
                                    quantity : 1,
                                    price: order.shipping_fee * 100
                                })
                            }
                            var trade_detail = {goods_detail:goods_detail};
                            var total_fee = order.amount* 100 + order.shipping_fee * 100;
                            var trade_time_start = app.moment(order.trade_time_start).format('YYYYMMDDHHmmss');
                            var trade_time_expire = app.moment(order.trade_time_expire).format('YYYYMMDDHHmmss');
                            var ip = this.req.get("X-Real-IP") || this.req.get("X-Forwarded-For") || this.req.ip;
                            this.body = yield app.app_weixin.unifiedorder(this.request.body.appid, this.request.body.open_id, ip, order.id, trade_detail, order.code, total_fee, trade_time_start, trade_time_expire);

                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'payNotify',
                verb: 'post',
                url: this.service_url_prefix + "/payNotify",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            self.logger.info('-----------------begin payNotify------------------------');
                            // self.logger.info(this.request.body);
                            var that = this;
                            var builder = new xml2js.Builder({
                                allowSurrogateChars: true
                            });
                            var notifyData = this.request.body.xml;

                            for(var key in  notifyData) {
                                if (app._.isArray(notifyData[key])) {
                                    notifyData[key] = notifyData[key][0];
                                }
                            }
                            self.logger.info(notifyData);
                            var signValid = yield app.app_weixin.validateNotifyData(notifyData);
                            self.logger.info('$$$ signValid：' + signValid);
                            if (!signValid) {
                                this.body = builder.buildObject({
                                    xml:{
                                        return_code: 'FAIL',
                                        return_msg: 'sign invalid'
                                    }
                                });
                                yield next;
                                return;
                            }

                            var out_trade_no = notifyData['out_trade_no'];
                            self.logger.info('out_trade_no:' + out_trade_no);
                            var transaction_id = notifyData['transaction_id'];
                            self.logger.info('transaction_id:' + transaction_id);
                            var payedOrder = yield app.modelFactory().model_one(app.models['mws_order'], { where: {
                                out_trade_no: out_trade_no
                            }});
                            self.logger.info(payedOrder);
                            if (!payedOrder) {
                                this.body = builder.buildObject({
                                    xml:{
                                        return_code: 'FAIL',
                                        return_msg: 'out_trade_no invalid'
                                    }
                                });
                                yield next;
                                return;
                            }
                            if (payedOrder.transaction_id) {
                                // 已经处理好通知
                                this.body = builder.buildObject({
                                    xml:{
                                        return_code: 'FAIL',
                                        return_msg: 'notify already processed'
                                    }
                                });
                                yield next;
                                return;
                            }

                            payedOrder.transaction_id = transaction_id;

                            yield payedOrder.save();

                            this.body = builder.buildObject({
                                xml: {

                                    return_code: 'SUCCESS'
                                }
                            });
                            self.logger.info(this.body);
                            self.logger.info('-----------------end payNotify------------------------');

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
            },
            {
                method: 'sendTemplateMessage',
                verb: 'post',
                url: this.service_url_prefix + "/sendTemplateMessage",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var wrapperRet = yield app.app_weixin.requestAccessToken(this.request.body.appid, this.request.body.code);
                            if (!wrapperRet.success) {
                                this.body = wrapperRet;
                                yield next;
                                return;
                            }
                            
                            console.log(gen_session_key)
                            var session = yield app.app_weixin.getSession(gen_session_key);
                            console.log(gen_session_key);
                            console.log(session);
                            this.body = app.wrapper.res.ret({
                                session_key: gen_session_key,
                                session_value: session
                            });
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