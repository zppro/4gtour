/**
 * pft Created by zppro on 16-9-20.
 * Target:处理票付通接口数据及与四季游数据同步
 */
var co = require('co');
var soap = require('soap');
var xml2js = require('xml2js');
var pftConfig = require('../pre-defined/pft-config.json');

module.exports = {
    init: function (ctx) {
        console.log('init pft... ');
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
        this.dl$xml2js = this.ctx.wrapper.cb(xml2js.parseString);


        var isProduction = ctx.conf.isProduction;
        isProduction = true;//使用正式接口
        var url = isProduction ? pftConfig.production.url:pftConfig.develop.url;
        this.logger.info('url:'+url);
        var account = isProduction ? pftConfig.production.account:pftConfig.develop.account;
        var password = isProduction ? pftConfig.production.password : pftConfig.develop.password;
        this.logger.info('account:'+account+' password:'+password);

        this.parseWSDL(null,url,account,password).then(function(){
            console.log('delegate methods... ');
            self.dl$Get_ScenicSpot_List = self.ctx.wrapper.cb(self.soapClient.Get_ScenicSpot_List);
            self.dl$Get_ScenicSpot_Info = self.ctx.wrapper.cb(self.soapClient.Get_ScenicSpot_Info);
            self.dl$Get_Ticket_List = self.ctx.wrapper.cb(self.soapClient.Get_Ticket_List);
            self.dl$Dynamic_Price_And_Storage = self.ctx.wrapper.cb(self.soapClient.Dynamic_Price_And_Storage);
            self.dl$PFT_Order_Submit = self.ctx.wrapper.cb(self.soapClient.PFT_Order_Submit);
            self.dl$Order_Globle_Search = self.ctx.wrapper.cb(self.soapClient.Order_Globle_Search);
            self.dl$Check_PersonID = self.ctx.wrapper.cb(self.soapClient.Check_PersonID);
            self.dl$reSend_SMS_Global_PL = self.ctx.wrapper.cb(self.soapClient.reSend_SMS_Global_PL);
            self.dl$Order_Change_Pro = self.ctx.wrapper.cb(self.soapClient.Order_Change_Pro);
        }).then(function(){
            console.log('parseWSDL done... ');
        });

        this.UUdoneSucessCode = '100';

        return this;
    },
    parseWSDL: function (outerLogger,wsdl,account,password) {
        var self = this;
        return co(function *() {
            try{
                if(!self.soapClient){
                    self.soapClient = yield self.ctx.wrapper.cb(soap.createClient)(wsdl);
                }
                self.authObject = self.authObject || {};
                self.authObject.ac = account;
                self.authObject.pw = password;

            }
            catch(e){
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    fetchScenicSpotList: function (outerLogger, num) {
        var self = this;
        return co(function *() {
            try {

                var param = self.ctx._.extend({n: num}, self.authObject);
                var rets = yield self.dl$Get_ScenicSpot_List(param);
                var rows = (yield self.dl$xml2js(rets[0].Get_ScenicSpot_List.$value, {
                    explicitArray: false,
                    ignoreAttrs: true
                })).Data.Rec;
 
                return rows;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    fetchScenicSpotInfo: function (outerLogger, scenicSpotId) {
        var self = this;
        return co(function *() {
            try {

                var param = self.ctx._.extend({n: scenicSpotId}, self.authObject);
                var rets = yield self.dl$Get_ScenicSpot_Info(param);
                var row = (yield self.dl$xml2js(rets[0].Get_ScenicSpot_Info.$value, {
                    explicitArray: false,
                    ignoreAttrs: true
                })).Data.Rec;
                
                return row;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    fetchTicket: function (outerLogger,scenicSpotId) {
        var self = this;
        return co(function *() {
            try {
                var param = self.ctx._.extend({n: scenicSpotId}, self.authObject);
                var rets = yield self.dl$Get_Ticket_List(param);
                var rows = (yield self.dl$xml2js(rets[0].Get_Ticket_List.$value, {
                    explicitArray: false,
                    ignoreAttrs: true
                })).Data.Rec; 
                if(!self.ctx._.isArray(rows) && self.ctx._.isObject(rows) && rows.UUerrorcode=='105') {
                    return [];
                }

                if(self.ctx._.isArray(rows)){
                    return rows;
                }
                else if(self.ctx._.isObject(rows)) {
                    if (rows.UUerrorcode == '105') {
                        return [];
                    }
                    else {
                        return [rows];
                    }
                }
            }
            catch (e) {
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    syncScenicSpot: function (outerLogger) {
        var self = this;
        return co(function *() {
            try {

                var rows =  yield self.fetchScenicSpotList(outerLogger,1000);

                if(rows.length>0) {
                    //简单格式化接口获取到的数据
                    for (var i = 0; i < rows.length; i++) {
                        if (rows[i].UUaddtime.indexOf('00-00-00 00:00:00') != -1) {
                            rows[i].UUaddtime = '1970-01-01 00:00:00';
                        }
                        rows[i].show_name = rows[i].UUtitle;
                    }

                    yield self.ctx.modelFactory().model_bulkInsert(self.ctx.models['idc_scenicSpot_PFT'], {
                        removeWhere: {},
                        rows: rows
                    });


                    //详细格式接口获取数据
                    var savedRows = yield self.ctx.modelFactory().model_query(self.ctx.models['idc_scenicSpot_PFT'], {
                        where: {status: 1},
                        select: 'UUid show_name introduction_url'
                    });
                    for (var i = 0; i < savedRows.length; i++) {
                        var scenicSpotId = savedRows[i].UUid;
                        var row = yield self.fetchScenicSpotInfo(outerLogger, savedRows[i].UUid);
                        if (row) {
                            yield self.ctx.modelFactory().model_update(self.ctx.models['idc_scenicSpot_PFT'], savedRows[i]._id, row);
                        }
                        console.log('complete syncScenicSpotInfo :' + i);

                        var needSave = false;
                        var show_name_of_scenicSpot_config = yield self.ctx.modelFactory().model_one(self.ctx.models['trv_idc_config'], {
                            where: {
                                idc_name: 'idc_scenicSpot_PFT',
                                primary_key: 'UUid',
                                primary_value: scenicSpotId,
                                config_key: 'show_name'
                            },
                            select: 'config_value'
                        });
                        if (show_name_of_scenicSpot_config) {
                            savedRows[i].show_name = show_name_of_scenicSpot_config.config_value;
                            needSave = true;
                        }
                        else{
                            yield self.ctx.modelFactory().model_create(self.ctx.models['trv_idc_config'], {
                                idc_name: 'idc_scenicSpot_PFT',
                                primary_key: 'UUid',
                                primary_value: scenicSpotId,
                                config_key: 'show_name',
                                config_value: savedRows[i].show_name
                            });
                        }

                        var introduction_url_of_scenicSpot_config = yield self.ctx.modelFactory().model_one(self.ctx.models['trv_idc_config'], {
                            where: {
                                idc_name: 'idc_scenicSpot_PFT',
                                primary_key: 'UUid',
                                primary_value: scenicSpotId,
                                config_key: 'introduction_url'
                            },
                            select: 'config_value'
                        });
                        if (introduction_url_of_scenicSpot_config) {
                            savedRows[i].introduction_url = introduction_url_of_scenicSpot_config.config_value;
                            needSave = true;
                        }
                        else{
                            yield self.ctx.modelFactory().model_create(self.ctx.models['trv_idc_config'], {
                                idc_name: 'idc_scenicSpot_PFT',
                                primary_key: 'UUid',
                                primary_value: scenicSpotId,
                                config_key: 'introduction_url',
                                config_value: savedRows[i].introduction_url
                            });
                        }

                        console.log('needSave:', needSave);
                        needSave && (yield savedRows[i].save());

                        console.log('complete idc_Config of idc_scenicSpot_PFT :' + i);

                    }
                }


                // var model = self.ctx.models['idc_scenicSpot_PFT'];
                // for(var i=0;i< rows.length;i++){
                //     console.log(i);
                //     yield model.insertMany([rows[i]], onInsert);
                // }
                //
                // self.ctx.models['idc_scenicSpot_PFT'].collection.insert(rows, onInsert);
                //
                // function onInsert(err, docs) {
                //     console.log(docs);
                //     if (err) {
                //         // TODO: handle error
                //     } else {
                //         console.info('%d potatoes were successfully stored.', docs.length);
                //     }
                // }
                return true;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
                return false;
            }
        }).catch(self.ctx.coOnError);
    },
    syncTicket: function (outerLogger,theScenicSpotId) {
        var self = this;
        return co(function *() {
            try {
                var savedRows;
                if(!theScenicSpotId){
                    var scenicSpot_rows = yield self.ctx.modelFactory().model_query(self.ctx.models['idc_scenicSpot_PFT'],{select:'UUid -_id',where:{status:1}});
 
                    for (var i = 0; i < scenicSpot_rows.length; i++) {
                        var scenicSpotId = scenicSpot_rows[i].UUid;
                        var rows = yield self.fetchTicket(outerLogger, scenicSpotId);

                        if (rows.length > 0) {

                            for (var j = 0; j < rows.length; j++) {
                                rows[j].show_name = rows[j].UUtitle;
                                rows[j].sale_price = rows[j].UUtprice;
                            }
                            yield self.ctx.modelFactory().model_bulkInsert(self.ctx.models['idc_ticket_PFT'], {
                                removeWhere: {UUlid: scenicSpotId},
                                rows: rows
                            });
                        }
                    }

                    savedRows = yield self.ctx.modelFactory().model_query(self.ctx.models['idc_ticket_PFT'], {
                        where: {status: 1},
                        select: 'UUid show_name sale_price'
                    });
                }
                else {
                    var rows = yield self.fetchTicket(outerLogger, theScenicSpotId);
                    if (rows.length > 0) {
                        for (var j = 0; j < rows.length; j++) {
                            rows[j].show_name = rows[j].UUtitle;
                            rows[j].sale_price = rows[j].UUtprice;
                        }

                        yield self.ctx.modelFactory().model_bulkInsert(self.ctx.models['idc_ticket_PFT'], {
                            removeWhere: {UUlid: theScenicSpotId},
                            rows: rows
                        });
                    }

                    savedRows = yield self.ctx.modelFactory().model_query(self.ctx.models['idc_ticket_PFT'], {
                        where: {status: 1,UUlid:theScenicSpotId},
                        select: 'UUid show_name sale_price'
                    });
                }

                
                for (var i = 0; i < savedRows.length; i++) {
                    var ticketId = savedRows[i].UUid;
                    var needSave = false;
                    var show_name_of_ticket_config = yield self.ctx.modelFactory().model_one(self.ctx.models['trv_idc_config'], {
                        where: {
                            idc_name: 'idc_ticket_PFT',
                            primary_key: 'UUid',
                            primary_value: ticketId,
                            config_key: 'show_name'
                        },
                        select: 'config_value'
                    });
                    console.log(show_name_of_ticket_config)
                    if (show_name_of_ticket_config) {
                        savedRows[i].show_name = show_name_of_ticket_config.config_value;
                        needSave = true;
                    }
                    else{
                        yield self.ctx.modelFactory().model_create(self.ctx.models['trv_idc_config'], {
                            idc_name: 'idc_ticket_PFT',
                            primary_key: 'UUid',
                            primary_value: ticketId,
                            config_key: 'show_name',
                            config_value: savedRows[i].show_name
                        });
                    }

                    var sale_price_of_scenicSpot_config = yield self.ctx.modelFactory().model_one(self.ctx.models['trv_idc_config'], {
                        where: {
                            idc_name: 'idc_ticket_PFT',
                            primary_key: 'UUid',
                            primary_value: ticketId,
                            config_key: 'sale_price'
                        },
                        select: 'config_value'
                    });
                    if (sale_price_of_scenicSpot_config) {
                        savedRows[i].sale_price = sale_price_of_scenicSpot_config.config_value;
                        needSave = true;
                    }
                    else{
                        yield self.ctx.modelFactory().model_create(self.ctx.models['trv_idc_config'], {
                            idc_name: 'idc_ticket_PFT',
                            primary_key: 'UUid',
                            primary_value: ticketId,
                            config_key: 'sale_price',
                            config_value: savedRows[i].sale_price
                        });
                    }

                    console.log('needSave:', needSave);
                    needSave && (yield savedRows[i].save());

                    console.log('complete idc_Config of idc_ticket_PFT:' + i);

                }
                
                return true;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
                return false;
            }
        }).catch(self.ctx.coOnError);
    },
    getDynamicPriceAndStorageByTicket: function (outerLogger, ticket, theDate) {
        var self = this;
        return co(function *() {
            try {
                var param = self.ctx._.extend({
                    pid: ticket.UUpid,
                    date: self.ctx.moment(theDate).format('YYYY-MM-DD'),
                    mode: '1', // [1 单个价格 2有效时间内的最低价],3 返回时间段价格(模式为 3 时,参数 7,8 必填)
                    ptype: '0', // 类型[0 供应价 1 零售价])
                    get_storage: '0', // 是否返回库存上限 默认0 不1是
                    m: ticket.UUaid, // 供应商id
                    sdate: null, // 有效开始时间 格式 2013-11-11
                    edate: null // 有效结束时间 格式 2013-11-11
                }, self.authObject);
                console.log(param)
                var rets = yield self.dl$Dynamic_Price_And_Storage(param);
                console.log(rets)
                var ret = (yield self.dl$xml2js(rets[0].Dynamic_Price_And_Storage.$value, {
                    explicitArray: false,
                    ignoreAttrs: true
                })).Data.Rec;
                console.log('ret:-----------------------------------------------')
                console.log(ret)
                return ret.UUsprice / 100.0;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
                return null;
            }
        }).catch(self.ctx.coOnError);
    },
    issueTicket: function (outerLogger, theOrderId) {
        var self = this;
        return co(function *() {
            try {
                var order = yield self.ctx.modelFactory().model_read(self.ctx.models['idc_order_PFT'], theOrderId);
                var ticket = yield self.ctx.modelFactory().model_one(self.ctx.models['idc_ticket_PFT'], {where: {UUid: order.UUid}});
                console.log(theOrderId)
                //获取结算价格
                var price = yield self.getDynamicPriceAndStorageByTicket(outerLogger, order.ticketId, order.travel_date);
                console.log('price1:')
                !price && (price = order.UUtprice)

                console.log(price)
                console.log('price-------------------------------------------------------------')

                var param = self.ctx._.extend({
                    lid: order.UUlid, // 景区id
                    tid: order.UUid, // 门票id
                    remotenum: order.code, // 远端订单号
                    tprice: price, // 结算单价
                    tnum: order.quantity, // 数量
                    playtime: self.ctx.moment(order.travel_date).format('YYYY-MM-DD'), // 游玩时间
                    ordername: order.link_man, // 取票人姓名
                    ordertel: order.link_phone, // 取票人手机
                    contactTEL: order.link_phone, // 联系人手机
                    smsSend: order.sms_send, // 是否需要发送短信 int (0 发送 1 不发送 注:发短信只会返回双方订单号,不发短信才会将凭 证信息返回)
                    paymode: 2, // 扣款方式 int (0使用账户余额 2使用供应商处余额 4现场支付 注:余额不足返回错误 122)
                    ordermode: 0, // 下单方式 int (0正常下单 1 手机用户下单 注:如无特殊请使用正常下单)
                    assembly: '', // 集合地点 (线路时需要,可为空)
                    series: '', // 团号 (线路时需要,可为空)(场次信息必填参数 格式:json_encode(array((int)场馆 id,(int)场次 id,(string)分区 id));)
                    concatID: 0, // 联票ID (未开放,请填0)
                    pCode: 0, // 套票ID (未开放,请填0)
                    m: order.UUaid, // (注:2.1&门票接口的 UUaid)
                    personID: order.tourist_id_no // 身份证号码
                }, self.authObject);
                console.log(param);
                var rets = yield self.dl$PFT_Order_Submit(param);
                var ret = (yield self.dl$xml2js(rets[0].PFT_Order_Submit.$value, {
                    explicitArray: false,
                    ignoreAttrs: true
                })).Data.Rec;

                console.log(ret);
                if (ret.UUerrorcode > 0) {
                    order.local_status = 'A0007'
                    return self.ctx.wrapper.res.error({code: ret.UUerrorcode, message: ret.UUerrorinfo});
                }

                order.settlement_price = price;
                order.UUordernum = ret.UUordernum;
                order.UUcode = ret.UUcode;
                order.UUqrcodeURL = ret.UUqrcodeURL;
                order.UUqrcodeIMG = ret.UUqrcodeIMG;
                order.UUordertime = self.ctx.moment();

                var pftOrderInfo = yield self.queryTicketOrder(outerLogger, order.code)
                if(pftOrderInfo){
                    order.UUgetaddr = pftOrderInfo.UUgetaddr; //取票信息
                    order.UUbegintime = pftOrderInfo.UUbegintime;//有效开始时间
                    order.UUordertime = pftOrderInfo.UUordertime;//票付通下单时间
                    order.UUendtime = pftOrderInfo.UUendtime;//有效结束时间
                    order.UUstatus = pftOrderInfo.UUstatus;//凭证号使用状态 0 未使用|1 已使用|2 已过期|3 被取消|4 凭证码被替代|5 被终端修改|6 被终端撤销|7 部分使用
                    order.UUpaystatus = pftOrderInfo.UUpaystatus;//0 景区到付|1 已成功|2 未支付
                    pftOrderInfo.UUdtime != '0000-00-00 00:00:00' && (order.UUdtime = pftOrderInfo.UUdtime);//票付通订单完成时间
                    order.UUremsg = pftOrderInfo.UUremsg;//短信发送次数
                    order.UUsmserror = pftOrderInfo.UUsmserror;//短信是否发送成功 0 成功 1 失败
                    pftOrderInfo.UUctime != '0000-00-00 00:00:00' && (order.UUctime = pftOrderInfo.UUctime);//票付通取消订单时间
                    order.UUpmode = pftOrderInfo.UUpmode;//1 支付宝|2 使用分销余额|3 信用支付|4 到付
                    order.UUpid = pftOrderInfo.UUpid;//产品id
                    order.UUorigin = pftOrderInfo.UUorigin;//订单来源
                    order.UUmemo = pftOrderInfo.UUmemo;//订单备注
                    order.UUstartplace = pftOrderInfo.UUstartplace;//出发城市或地区 (线路)
                    order.UUendplace = pftOrderInfo.UUendplace;//目的地 (线路)
                }
                if( order.UUpaystatus == 1){
                    order.local_status = 'A0005'
                }

                yield order.save();

                return self.ctx.wrapper.res.ret(order);
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
                return self.ctx.wrapper.res.error(e);
            }
        }).catch(self.ctx.coOnError);
    },
    queryTicketOrder: function (outerLogger, orderCode) {
        var self = this;
        return co(function *() {
            try {
                var param = self.ctx._.extend({
                    sid: '',
                    mid: '',
                    aid: '',
                    tid: '',
                    ltitle: '',
                    ttitle: '',
                    btime1: '',
                    etime1: '',
                    btime2: '',
                    etime2: '',
                    btime3: '',
                    etime3: '',
                    ordernum: '',
                    remotenum: orderCode,
                    oname: '',
                    otel: '',
                    status: '',
                    pays: '',
                    orderby: '',
                    sort: '',
                    rstart:'',
                    n: '',
                    c: '',
                    contactTEL: '',
                    payinfo: '',
                    p_type: '',
                    ordertype: '',
                    concat: '',
                    ifpack: '',
                    code: '',
                    personid: '',
                    m: ''
                }, self.authObject);
                // console.log(param)
                var rets = yield self.dl$Order_Globle_Search(param);
                // console.log(rets)
                var ret = (yield self.dl$xml2js(rets[0].Order_Globle_Search.$value, {
                    explicitArray: false,
                    ignoreAttrs: true
                })).Data.Rec;
                // console.log(ret)
                return ret;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
                return null;
            }
        }).catch(self.ctx.coOnError);
    },
    checkIDNo: function (outerLogger, IDNo) {
        var self = this;
        return co(function *() {
            try {
                var param = self.ctx._.extend({
                    personId: IDNo
                }, self.authObject);
                // console.log(param)
                var rets = yield self.dl$Check_PersonID(param);
                // console.log(rets)
                var ret = (yield self.dl$xml2js(rets[0].Check_PersonID.$value, {
                    explicitArray: false,
                    ignoreAttrs: true
                })).Data.Rec;
                // console.log(ret)
                return ret.UUdone == self.UUdoneSucessCode;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
                return false;
            }
        }).catch(self.ctx.coOnError);
    },
    reSendSms: function (outerLogger, theOrderId) {
        var self = this;
        return co(function *() {
            try {
                var order = yield self.ctx.modelFactory().model_read(self.ctx.models['idc_order_PFT'], theOrderId);
                var param = self.ctx._.extend({
                    ordern: order.UUordernum
                }, self.authObject);
                // console.log(param)
                var rets = yield self.dl$reSend_SMS_Global_PL(param);
                // console.log(rets)
                var ret = (yield self.dl$xml2js(rets[0].reSend_SMS_Global_PL.$value, {
                    explicitArray: false,
                    ignoreAttrs: true
                })).Data.Rec;
                // console.log(ret)
                if (ret.UUdone == self.UUdoneSucessCode){
                    var pftOrderInfo = yield self.queryTicketOrder(outerLogger, order.code);
                    if(pftOrderInfo) {
                        order.UUgetaddr = pftOrderInfo.UUgetaddr; //取票信息
                        order.UUbegintime = pftOrderInfo.UUbegintime;//有效开始时间
                        order.UUordertime = pftOrderInfo.UUordertime;//票付通下单时间
                        order.UUendtime = pftOrderInfo.UUendtime;//有效结束时间
                        order.UUstatus = pftOrderInfo.UUstatus;//凭证号使用状态 0 未使用|1 已使用|2 已过期|3 被取消|4 凭证码被替代|5 被终端修改|6 被终端撤销|7 部分使用
                        order.UUpaystatus = pftOrderInfo.UUpaystatus;//0 景区到付|1 已成功|2 未支付
                        pftOrderInfo.UUdtime != '0000-00-00 00:00:00' && (order.UUdtime = pftOrderInfo.UUdtime);//票付通订单完成时间
                        order.UUremsg = pftOrderInfo.UUremsg;//短信发送次数
                        order.UUsmserror = pftOrderInfo.UUsmserror;//短信是否发送成功 0 成功 1 失败
                        pftOrderInfo.UUctime != '0000-00-00 00:00:00' && (order.UUctime = pftOrderInfo.UUctime);//票付通取消订单时间
                        order.UUpmode = pftOrderInfo.UUpmode;//1 支付宝|2 使用分销余额|3 信用支付|4 到付
                        order.UUpid = pftOrderInfo.UUpid;//产品id
                        order.UUorigin = pftOrderInfo.UUorigin;//订单来源
                        order.UUmemo = pftOrderInfo.UUmemo;//订单备注
                        order.UUstartplace = pftOrderInfo.UUstartplace;//出发城市或地区 (线路)
                        order.UUendplace = pftOrderInfo.UUendplace;//目的地 (线路)
                        yield order.save();
                    }
                    return self.ctx.wrapper.res.ret(order);
                }
                else
                    return self.ctx.wrapper.res.error({code: ret.UUdone, message: 'PFT重发短信错误'});
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
                return self.ctx.wrapper.res.error(e);
            }
        }).catch(self.ctx.coOnError);
    },
    refundForTicket: function (outerLogger, theOrderId) {
        var self = this;
        return co(function *() {
            try {
                var order = yield self.ctx.modelFactory().model_read(self.ctx.models['idc_order_PFT'], theOrderId);
                var ticket = yield self.ctx.modelFactory().model_one(self.ctx.models['idc_ticket_PFT'], {where: {UUid: order.UUid}});
                // var ticket = yield self.ctx.modelFactory().model_read(self.ctx.models['idc_ticket_PFT'],order.ticketId); 因为随着同步ticketId会变化而UUid不会变
                var param = self.ctx._.extend({
                    ordern: order.UUordernum,
                    num: '0'
                }, self.authObject);
                // console.log(param)
                var rets = yield self.dl$Order_Change_Pro(param);
                // console.log(rets)
                var ret = (yield self.dl$xml2js(rets[0].Order_Change_Pro.$value, {
                    explicitArray: false,
                    ignoreAttrs: true
                })).Data.Rec;
                console.log('refundForTicket:')
                console.log(ret)
                var pftOrderInfo = yield self.queryTicketOrder(outerLogger, order.code);
                if(pftOrderInfo) {
                    order.UUgetaddr = pftOrderInfo.UUgetaddr; //取票信息
                    order.UUbegintime = pftOrderInfo.UUbegintime;//有效开始时间
                    order.UUordertime = pftOrderInfo.UUordertime;//票付通下单时间
                    order.UUendtime = pftOrderInfo.UUendtime;//有效结束时间
                    order.UUstatus = pftOrderInfo.UUstatus;//凭证号使用状态 0 未使用|1 已使用|2 已过期|3 被取消|4 凭证码被替代|5 被终端修改|6 被终端撤销|7 部分使用
                    order.UUpaystatus = pftOrderInfo.UUpaystatus;//0 景区到付|1 已成功|2 未支付
                    pftOrderInfo.UUdtime != '0000-00-00 00:00:00' && (order.UUdtime = pftOrderInfo.UUdtime);//票付通订单完成时间
                    order.UUremsg = pftOrderInfo.UUremsg;//短信发送次数
                    order.UUsmserror = pftOrderInfo.UUsmserror;//短信是否发送成功 0 成功 1 失败
                    pftOrderInfo.UUctime != '0000-00-00 00:00:00' && (order.UUctime = pftOrderInfo.UUctime);//票付通取消订单时间
                    order.UUpmode = pftOrderInfo.UUpmode;//1 支付宝|2 使用分销余额|3 信用支付|4 到付
                    order.UUpid = pftOrderInfo.UUpid;//产品id
                    order.UUorigin = pftOrderInfo.UUorigin;//订单来源
                    order.UUmemo = pftOrderInfo.UUmemo;//订单备注
                    order.UUstartplace = pftOrderInfo.UUstartplace;//出发城市或地区 (线路)
                    order.UUendplace = pftOrderInfo.UUendplace;//目的地 (线路)
                }
                if(ticket.UUrefund_audit == 0) {
                    if (ret.UUdone == self.UUdoneSucessCode){
                        order.local_status = 'A0011';
                        yield order.save();
                        return self.ctx.wrapper.res.ret(order);
                    } else
                        return self.ctx.wrapper.res.error({code: ret.UUdone, message: 'PFT直接退款错误'});
                } else {
                    if (ret.UUdone == '1095'){
                        order.local_status = 'A0009';
                        yield order.save();
                        return self.ctx.wrapper.res.ret(order);
                    }
                    else
                        return self.ctx.wrapper.res.error({code: ret.UUdone, message: 'PFT申请退款错误'});
                }
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
                return self.ctx.wrapper.res.error(e);
            }
        }).catch(self.ctx.coOnError);
    },
    refreshOrderInfo: function (outerLogger, theOrderId) {
        var self = this;
        return co(function *() {
            try {
                var order = yield self.ctx.modelFactory().model_read(self.ctx.models['idc_order_PFT'], theOrderId);
                var pftOrderInfo = yield self.queryTicketOrder(outerLogger, order.code);
                if(!pftOrderInfo) {
                    return self.ctx.wrapper.res.error({code: '52101', message: '无法找到远端订单'});
                } else{
                    order.UUgetaddr = pftOrderInfo.UUgetaddr; //取票信息
                    order.UUbegintime = pftOrderInfo.UUbegintime;//有效开始时间
                    order.UUordertime = pftOrderInfo.UUordertime;//票付通下单时间
                    order.UUendtime = pftOrderInfo.UUendtime;//有效结束时间
                    order.UUstatus = pftOrderInfo.UUstatus;//凭证号使用状态 0 未使用|1 已使用|2 已过期|3 被取消|4 凭证码被替代|5 被终端修改|6 被终端撤销|7 部分使用
                    order.UUpaystatus = pftOrderInfo.UUpaystatus;//0 景区到付|1 已成功|2 未支付
                    pftOrderInfo.UUdtime != '0000-00-00 00:00:00' && (order.UUdtime = pftOrderInfo.UUdtime);//票付通订单完成时间
                    order.UUremsg = pftOrderInfo.UUremsg;//短信发送次数
                    order.UUsmserror = pftOrderInfo.UUsmserror;//短信是否发送成功 0 成功 1 失败
                    pftOrderInfo.UUctime != '0000-00-00 00:00:00' && (order.UUctime = pftOrderInfo.UUctime);//票付通取消订单时间
                    order.UUpmode = pftOrderInfo.UUpmode;//1 支付宝|2 使用分销余额|3 信用支付|4 到付
                    order.UUpid = pftOrderInfo.UUpid;//产品id
                    order.UUorigin = pftOrderInfo.UUorigin;//订单来源
                    order.UUmemo = pftOrderInfo.UUmemo;//订单备注
                    order.UUstartplace = pftOrderInfo.UUstartplace;//出发城市或地区 (线路)
                    order.UUendplace = pftOrderInfo.UUendplace;//目的地 (线路)
                }
                yield order.save();

                return self.ctx.wrapper.res.ret(order);
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
                return self.ctx.wrapper.res.error(e);
            }
        }).catch(self.ctx.coOnError);
    }
};