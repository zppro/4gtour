/**
 * Created by zppro on 16-10-12.
 * api for mobile web app
 */
var rp = require('request-promise-native');
var IDC01 = require('../pre-defined/dictionary.json')['IDC01'];
var IDC02 = require('../pre-defined/dictionary.json')['IDC02'];

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
            /************************票付通相关*****************************/
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
                            var ticketsOfScenicSpot = yield app.modelFactory().model_query(app.models['idc_ticket_PFT'],{ where: { status:1,UUlid: scenicSpot.UUid }, select: 'UUlid UUid show_name sale_price UUtprice UUdelaydays UUddays UUdhour UUbuy_limit_up UUbuy_limit_low UUtourist_info'});

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
                                ret.selected_ticket_delay_days = ticketWithMinSalePrice.UUdelaydays;
                                ret.selected_ticket_buy_days_in_advance = ticketWithMinSalePrice.UUddays;
                                ret.selected_ticket_buy_hour_in_advance = ticketWithMinSalePrice.UUdhour;
                                ret.selected_ticket_buy_limit_up = ticketWithMinSalePrice.UUbuy_limit_up
                                ret.selected_ticket_buy_limit_low = ticketWithMinSalePrice.UUbuy_limit_low
                                ret.selected_ticket_tourist_IDNo_flag = ticketWithMinSalePrice.UUtourist_info
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
                                        ticket_name: '$show_name',
                                        ticket_delay_days: '$UUdelaydays',
                                        ticket_buy_days_in_advance: '$UUddays',
                                        ticket_buy_hour_in_advance: '$UUdhour',
                                        ticket_buy_limit_up: '$UUbuy_limit_up',
                                        ticket_buy_limit_low: '$UUbuy_limit_low',
                                        ticket_tourist_IDNo_flag: '$UUtourist_info'
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
            /************************本地订单相关*****************************/
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
                method: 'order',
                verb: 'post',
                url: this.service_url_prefix + "/order",
                handler: function (app, options) {
                    return function *(next) {
                        try {

                            console.log(this.request.body)
                            var ticket = yield app.modelFactory().model_one(app.models['idc_ticket_PFT'], {
                                where: {
                                    UUlid: this.request.body.UUlid,
                                    UUid: this.request.body.UUid
                                }
                            });
                            if (!ticket) {
                                this.body = app.wrapper.res.error({code: 52001, message: '无效的门票编号'});
                                yield next;
                            }

                            if(ticket.UUtourist_info == 1){
                                var IDNo = this.request.body.tourist_id_no;
                                var isIDNo = yield app.pft.checkIDNo(self.logger,this.request.body.tourist_id_no);
                                if (!isIDNo) {
                                    this.body = app.wrapper.res.error({code: 52002, message: '无效的身份证号码'});
                                    yield next;
                                }
                            }
                            
                            var order = app._.extend({
                                code: 'server-gen',
                                local_status: 'A0001',
                                ticketId: ticket._id,
                                UUtprice: ticket.UUtprice,
                                UUaid: ticket.UUaid,
                                sms_send: 0,
                                deduction_type: 0,
                                order_type: 0,
                                UUstatus: 0,
                                UUpaystatus: 2
                            }, this.payload.member, this.request.body);
                            order.amount = order.p_price * order.quantity;
                            console.log(order);
                            this.body = app.wrapper.res.ret(yield app.modelFactory().model_create(app.models['idc_order_PFT'], order));
                            console.log(this.body);
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
                method: 'order-details',
                verb: 'get',
                url: this.service_url_prefix + "/order-details/:orderId",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var order = yield app.modelFactory().model_read(app.models['idc_order_PFT'],this.params.orderId);
                            var scenicSpot = yield app.modelFactory().model_one(app.models['idc_scenicSpot_PFT'],{where: {UUid: order.UUlid}});
                            var pay_type = order.pay_type;
                            if(pay_type){
                                pay_type = IDC02[order.pay_type].name;
                            } else {
                                pay_type = '';
                            }
                            var ret = {
                                orderInfo: {
                                    pay_type: pay_type,
                                    status_name: IDC01[order.local_status].name,
                                    pay_time: order.pay_time,
                                    price: order.p_price,
                                    quantity: order.quantity,
                                    amount: order.amount,
                                    link_man: order.link_man,
                                    link_phone: order.link_phone,
                                    travel_date: order.travel_date,
                                    order_show: order.local_status != 'A0001',
                                    qr_show: (order.local_status == 'A0005' || order.local_status == 'A0009' || order.local_status == 'A0011'),
                                    validate_code: order.UUcode,//凭证号
                                    qrcode_img: order.UUqrcodeIMG//二维码图片
                                },
                                scenicSpotInfo: {
                                    name: scenicSpot.show_name,
                                    ticket_name: order.p_name,
                                    img: scenicSpot.UUimgpath,
                                    level: scenicSpot.UUjtype,
                                    tel: scenicSpot.UUtel,
                                    runtime: scenicSpot.UUruntime,
                                    address: scenicSpot.UUaddress,
                                    tip: scenicSpot.UUjqts
                                }
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
            /************************代理登录相关*****************************/
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
                method: 'proxyLoginByWeiXinOpenIdSyncToAPICloud',
                verb: 'post',
                url: this.service_url_prefix + "/proxyLoginByWeiXinOpenIdSyncToAPICloud",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var ret1 = yield rp({method: 'POST', url: 'http://im.okertrip.com/api/login/index.html', form: {
                                category : 1,
                                wxopenid : this.request.body.openid,
                                wxunionid : this.request.body.unionid,
                                nickname : this.request.body.nickname,
                                gender: this.request.body.sex,
                                language : '',
                                country : this.request.body.country,
                                province : this.request.body.province,
                                city : this.request.body.city,
                                headpic : this.request.body.headimgurl,
                                uuid : this.request.body.apiUUID
                            }, json: true});
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
            /************************微信相关*****************************/
            {
                method: 'getMPWeiXinConfig',
                verb: 'get',
                url: this.service_url_prefix + "/getMPWeiXinConfig",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            console.log(this.host)
                            var config = yield app.mp_weixin.createWXConfig(this.host);
                            console.log(config)
                            this.body = app.wrapper.res.ret(config);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            }
            /************************???相关*****************************/
        ];

        return this;
    }
}.init();
//.init(option);