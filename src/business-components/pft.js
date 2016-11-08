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
    }
};