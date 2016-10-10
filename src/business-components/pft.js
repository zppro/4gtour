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

        //120cc 13003673092  密码gxr888
        //正式账号：536075 密码：c40077a84036c3f708e47fb775d2471d
        //测试账号 100019 密码jjl4yk11f82ce6c0f33a5c003f2fec56
        var isProduction = ctx.conf.isProduction;
        isProduction = true;//使用正式接口
        var url = isProduction ? 'http://open.12301.cc/openService/MXSE.wsdl':'http://open.12301dev.com/openService/MXSE_beta.wsdl';
        this.logger.info('url:'+url);
        var account = isProduction ? '536075':'100019';
        var password = isProduction ? 'c40077a84036c3f708e47fb775d2471d':'jjl4yk11f82ce6c0f33a5c003f2fec56';
        this.logger.info('account:'+account+' password:'+password);

        this.parseWSDL(null,url,account,password).then(function(){
            console.log('delegate methods... ');
            self.dl$Get_ScenicSpot_List = self.ctx.wrapper.cb(self.soapClient.Get_ScenicSpot_List);
            self.dl$Get_ScenicSpot_Info = self.ctx.wrapper.cb(self.soapClient.Get_ScenicSpot_Info);
            self.dl$Get_Ticket_List = self.ctx.wrapper.cb(self.soapClient.Get_Ticket_List);
        }).then(function(){
            console.log('parseWSDL done... ');
        });




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

                console.log(row);
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
                        select: 'UUid'
                    });
                    for (var i = 0; i < savedRows.length; i++) {
                        var scenicSpotId = savedRows[i].UUid;
                        var row = yield self.fetchScenicSpotInfo(outerLogger, savedRows[i].UUid);
                    
                        if (row) {
                            yield self.ctx.modelFactory().model_update(self.ctx.models['idc_scenicSpot_PFT'], savedRows[i]._id, row);
                        }
                        console.log('complete syncScenicSpotInfo :' + i);

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