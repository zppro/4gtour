/**
 * Created by zppro on 16-10-12.
 * api for mobile web app
 */
var rp = require('request-promise-native'); 
var weixin = require('../pre-defined/weixin-config.json');

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
                method: 'scenicSpots',
                verb: 'get',
                url: this.service_url_prefix + "/scenicSpots",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var lowPriceTicketsPerScenicSpot = yield app.modelFactory().model_aggregate(app.models['idc_ticket_PFT'], [
                                {
                                    $match: {
                                        status: 1
                                    }
                                },
                                {
                                    $group: {
                                        _id: {UUlid: '$UUlid'},
                                        price: {$min: '$sale_price'}
                                    }
                                },
                                {$sort: {"price": 1}},
                                {
                                    $project: {
                                        scenicSpotId: '$_id.UUlid',
                                        price: '$price',
                                        _id: 0
                                    }
                                }
                            ]);

                            var rows_ScenicSpot = yield app.modelFactory().model_query(app.models['idc_scenicSpot_PFT'],{ where: { status:1 }, select: 'UUid show_name UUimgpath UUaddress'});

                            var rows = app._.map(rows_ScenicSpot,function(o) {
                                var price = app._.find(lowPriceTicketsPerScenicSpot, function (item) {
                                    return item.scenicSpotId == o.UUid
                                }).price;
                                return {id:o.id, UUid: o.UUid, title: o.show_name, img: o.UUimgpath, price: price, description: o.UUaddress}
                            });
 
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
                method: 'scenicSpots',
                verb: 'post',
                url: this.service_url_prefix + "/scenicSpots",
                handler: function (app, options) {
                    return function *(next) {
                        try {

                            var lowPriceTicketsPerScenicSpot = yield app.modelFactory().model_aggregate(app.models['idc_ticket_PFT'], [
                                {
                                    $match: {
                                        status: 1
                                    }
                                },
                                {
                                    $group: {
                                        _id: {UUlid: '$UUlid'},
                                        price: {$min: '$sale_price'}
                                    }
                                },
                                {$sort: {"price": 1}},
                                {
                                    $project: {
                                        scenicSpotId: '$_id.UUlid',
                                        price: '$price',
                                        _id: 0
                                    }
                                }
                            ]);

                            var rows_ScenicSpot = yield app.modelFactory().model_query(app.models['idc_scenicSpot_PFT'], {
                                    where: {status: 1},
                                    select: 'UUid show_name UUimgpath UUaddress'
                                },
                                {limit: this.request.body.page.size, skip: this.request.body.page.skip});

                            var rows = app._.map(rows_ScenicSpot, function (o) {
                                var price = app._.find(lowPriceTicketsPerScenicSpot, function (item) {
                                    return item.scenicSpotId == o.UUid
                                }).price;
                                return {
                                    id: o.id,
                                    UUid: o.UUid,
                                    title: o.show_name,
                                    img: o.UUimgpath,
                                    price: price,
                                    description: o.UUaddress
                                }
                            });
                            
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
                method: 'scenicSpot',
                verb: 'get',
                url: this.service_url_prefix + "/scenicSpot/:scenicSpotId",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var scenicSpotId = this.params.scenicSpotId;

                            var scenicSpot = yield app.modelFactory().model_read(app.models['idc_scenicSpot_PFT'],scenicSpotId);
                            var ticketsOfScenicSpot = yield app.modelFactory().model_query(app.models['idc_ticket_PFT'],{ where: { status:1,UUlid: scenicSpot.UUid }, select: 'UUlid UUid show_name sale_price UUtprice'});

                            var ret = {
                                id: scenicSpot._id,
                                img: scenicSpot.UUimgpath,
                                title: scenicSpot.show_name,
                                buy_quantity: 1,
                                level: scenicSpot.UUjtype,
                                tickets_count: ticketsOfScenicSpot.length,
                                address: scenicSpot.UUaddress,
                                runtime: scenicSpot.UUruntime,
                                tip: scenicSpot.UUjqts,
                                travel_guide: scenicSpot.UUjtzn,
                                introduction_url: scenicSpot.introduction_url
                            };
 
                            var ticketWithMinSalePrice = app._.min(ticketsOfScenicSpot,function(o) {
                                return o.sale_price
                            });
                            
                            if(ticketWithMinSalePrice){
                                ret.selected_ticket_id = ticketWithMinSalePrice._id;
                                ret.selected_ticket_uulid = ticketWithMinSalePrice.UUlid;
                                ret.selected_ticket_uuid = ticketWithMinSalePrice.UUid;
                                ret.selected_ticket_price = ticketWithMinSalePrice.sale_price;
                                ret.selected_ticket_bid_price = ticketWithMinSalePrice.UUtprice;
                                ret.selected_ticket_name = ticketWithMinSalePrice.show_name;
                            }
                            this.body = app.wrapper.res.ret(ret);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'tickets',
                verb: 'get',
                url: this.service_url_prefix + "/tickets/:scenicSpotId",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var scenicSpot = yield app.modelFactory().model_read(app.models['idc_scenicSpot_PFT'],this.params.scenicSpotId);

                            var ticketsOfScenicSpot = yield app.modelFactory().model_aggregate(app.models['idc_ticket_PFT'], [
                                {
                                    $match: {
                                        status: 1,
                                        UUlid: scenicSpot.UUid
                                    }
                                },
                                {$sort: {"sale_price": 1}},
                                {
                                    $project: {
                                        ticket_id: '$_id',
                                        ticket_uulid: '$UUlid',
                                        ticket_uuid: '$UUid',
                                        ticket_price: '$sale_price',
                                        ticket_bid_price: '$UUtprice',
                                        ticket_name: '$show_name'
                                    }
                                }
                            ]);

                            this.body = app.wrapper.res.rows(ticketsOfScenicSpot);
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
                verb: 'get',
                url: this.service_url_prefix + "/orders/:memberId",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var rows = yield app.modelFactory().model_query(app.models['idc_order_PFT'],{ where: { status:1, member_id:this.params.memberId}, select: 'p_name code check_in_time amount local_status'});

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
                method: 'orders',
                verb: 'post',
                url: this.service_url_prefix + "/orders",
                handler: function (app, options) {
                    return function *(next) {
                        try {

                            var member_id = this.payload.member.member_id;
                            if(member_id == 'anonymity')
                                member_id = 'everyone';
                            console.log('member_id:' + member_id);
                            var rows = yield app.modelFactory().model_query(app.models['idc_order_PFT'], {
                                    where: {
                                        status: 1,
                                        member_id: member_id
                                    }, select: 'p_name code check_in_time amount local_status local_status_name'
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
                verb: 'post',
                url: this.service_url_prefix + "/order",
                handler: function (app, options) {
                    return function *(next) {
                        try {

                            var order = app._.extend({
                                code: 'server-gen',
                                local_status: 'A0001',
                                sms_send: 1,
                                deduction_type: 0,
                                order_type: 0,
                                UUstatus:0,
                                UUpaystatus:2
                            }, this.payload.member, this.request.body);
                            order.amount = order.p_price * order.quantity;

                            this.body = app.wrapper.res.ret(yield app.modelFactory().model_create(app.models['idc_order_PFT'], order));

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
                method: 'order',
                verb: 'put',
                url: this.service_url_prefix + "/order/:id",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            // send
                            var payload = app._.extend({pay_time: Date.now()}, this.request.body);
                            var ret = yield app.modelFactory().model_update(app.models['idc_order_PFT'], this.params.id, payload);
                            var theOrder = yield app.modelFactory().model_read(app.models['idc_order_PFT'], this.params.id);
                            yield app.mail.send$PFTOrderPaySuccess(theOrder);
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
                method: 'proxyLogin',
                verb: 'post',
                url: this.service_url_prefix + "/proxyLogin",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var ret1 = yield rp({method: 'POST', url: 'http://im.okertrip.com/api/login/index.html', form: this.request.body, json: true});
                            if (ret1.err_code == '0') {
                                var token = ret1.info.token;
                                var ret2 = yield rp({url: 'http://im.okertrip.com/api/personal/info.html?token=' + token, json: true});
                                if (ret2.err_code == '0') {
                                    console.log(ret2)
                                    this.body = app.wrapper.res.ret({memberInfo: {member_id: ret2.info.u_id, member_name: ret2.info.u_nickname, head_portrait: ret2.info.u_headpic, member_description: ret2.info.u_description}, token: token});
                                }
                                else {
                                    this.body = app.wrapper.res.error({code: ret2.err_code, message: ret2.message});
                                }
                            }
                            else {
                                this.body = app.wrapper.res.error({code: ret1.err_code, message: ret1.message});
                            }
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
                method: 'proxyLoginByToken',
                verb: 'post',
                url: this.service_url_prefix + "/proxyLoginByToken",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var token = this.request.body.token;
                            console.log(token)
                            var ret2 = yield rp({url: 'http://im.okertrip.com/api/personal/info.html?token=' + token, json: true});
                            if (ret2.err_code == '0') {
                                console.log(ret2)
                                this.body = app.wrapper.res.ret({memberInfo: {member_id: ret2.info.u_id, member_name: ret2.info.u_nickname, head_portrait: ret2.info.u_headpic, member_description: ret2.info.u_description}, token: token});
                            }
                            else {
                                this.body = app.wrapper.res.error({code: ret2.err_code, message: ret2.message});
                            }
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
                method: 'getWeiXinConfig',
                verb: 'get',
                url: this.service_url_prefix + "/getWeiXinConfig",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            console.log(this.host)
                            var config = yield app.weixin.createWXConfig(this.host);
                            console.log(config)
                            this.body = app.wrapper.res.ret(config);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'hb',
                verb: 'get',
                url: this.service_url_prefix + "/hb",
                handler: function (app, options) {
                    return function * (next) {
                        try {
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
                method: 'tpost',
                verb: 'post',
                url: this.service_url_prefix + "/tpost",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            console.log(this.request.body);
                            this.body = app.wrapper.res.ret(this.request.body);
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