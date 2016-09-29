/**
 * pft Created by zppro on 16-9-20.
 * Target:处理票付通接口数据及与四季游数据同步
 */
var co = require('co');
var soap = require('soap');
var xml2js = require('xml2js');

module.exports = {
    init: function (ctx) {
        console.log('init pft... ');
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

        //账号 13003673092  密码gxr888
        //测试 100019 密码jjl4yk11f82ce6c0f33a5c003f2fec56
        this.parseWSDL(null,'http://open.12301dev.com/openService/MXSE_beta.wsdl','100019','jjl4yk11f82ce6c0f33a5c003f2fec56');
        console.log('parseWSDL done... ');
        return this;
    },
    parseWSDL: function (outerLogger,wsdl,account,password) {
        var self = this;
        co(function *() {
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
    fetchScenicSpot: function (outerLogger,num) {
        var self = this;
        return co(function *() {
            try {

                var param = self.ctx._.extend({n: num}, self.authObject);
                var dl$Get_ScenicSpot_List = self.ctx.wrapper.cb(self.soapClient.Get_ScenicSpot_List);
                var rets = yield dl$Get_ScenicSpot_List(param);
                var rows = (yield self.dl$xml2js(rets[0].Get_ScenicSpot_List.$value, {
                    explicitArray: false,
                    ignoreAttrs: true
                })).Data.Rec;

                console.log(rows);
                return rows;
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
                var dl$Get_Ticket_List = self.ctx.wrapper.cb(self.soapClient.Get_Ticket_List);
                var rets = yield dl$Get_Ticket_List(param);
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

                var rows =  yield self.fetchScenicSpot(outerLogger,1000);

                if(rows.length>0) {
                    //简单格式化接口获取到的数据
                    for (var i = 0; i < rows.length; i++) {
                        if (rows[i].UUaddtime.indexOf('00-00-00 00:00:00') != -1) {
                            rows[i].UUaddtime = '1970-01-01 00:00:00';
                        }
                    }

                    yield self.ctx.modelFactory().model_bulkInsert(self.ctx.models['idc_scenicSpot_PFT'], {
                        removeWhere: {},
                        rows: rows
                    });
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

                if(!theScenicSpotId){
                    var scenicSpot_rows = yield self.ctx.modelFactory().model_query(self.ctx.models['idc_scenicSpot_PFT'],{select:'UUid -_id',where:{status:1}});
 
                    for (var i = 0; i < scenicSpot_rows.length; i++) {
                        var scenicSpotId = scenicSpot_rows[i].UUid;
                        var rows = yield self.fetchTicket(outerLogger, scenicSpotId);

                        if (rows.length > 0) {
                            yield self.ctx.modelFactory().model_bulkInsert(self.ctx.models['idc_ticket_PFT'], {
                                removeWhere: {UUlid: scenicSpotId},
                                rows: rows
                            });
                        }
                        console.log('complete :' + i);
                    }
                }
                else {
                    var rows = yield self.fetchTicket(outerLogger, theScenicSpotId);
                    console.log(rows);
                    console.log('theScenicSpotId:' + theScenicSpotId);
                    if (rows.length > 0) {

                        yield self.ctx.modelFactory().model_bulkInsert(self.ctx.models['idc_ticket_PFT'], {
                            removeWhere: {UUlid: theScenicSpotId},
                            rows: rows
                        });
                    }

                }
                return true;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
                return false;
            }
        }).catch(self.ctx.coOnError);
    }
};