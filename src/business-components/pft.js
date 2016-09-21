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
        this.ctx = ctx;
        this.logger = require('log4js').getLogger(this.filename);
        if (!this.logger) {
            console.error('logger not loaded in ' + this.file);
        }
        else {
            this.logger.info(this.file + " loaded!");
        }
        this.dl$xml2js = this.ctx.wrapper.cb(xml2js.parseString);

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
    fetch$Get_ScenicSpot_List: function (outerLogger,num) {
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

                return rows;
            }
            catch (e) {
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    fetch$Get_Ticket_List: function (outerLogger,scenicSpotId) {
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

                return rows;
            }
            catch (e) {
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    sync$ScenicSpot: function (outerLogger) {
        var self = this;
        return co(function *() {
            try {

                var rows =  yield self.fetch$Get_ScenicSpot_List(outerLogger,1000);
                //
                // yield self.ctx.modelFactory().model_bulkInsert(self.ctx.models['idc_scenicSpot_PFT'], {
                //     //removeWhere: {},
                //     rows: rows
                // });
                // yield self.ctx.modelFactory().model_create(self.ctx.models['idc_scenicSpot_PFT'], rows[0]);
                var model = self.ctx.models['idc_scenicSpot_PFT'];

                for(var i=0;i< rows.length;i++){
                    console.log(i);
                    yield model.insertMany([rows[i]], onInsert);
                }

                //self.ctx.models['idc_scenicSpot_PFT'].collection.insert(rows, onInsert);

                function onInsert(err, docs) {
                    console.log(docs);
                    if (err) {
                        // TODO: handle error
                    } else {
                        console.info('%d potatoes were successfully stored.', docs.length);
                    }
                }
                return rows;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    }
};