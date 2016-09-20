/**
 * init Created by zppro on 16-9-19.
 * Target:初始化基本数据
 */

var soap = require('soap');
var xml2js = require('xml2js');

module.exports = {
    init: function (option) {
        var self = this;
        this.file = __filename;
        this.filename = this.file.substr(this.file.lastIndexOf('/') + 1);
        this.module_name = this.filename.substr(0, this.filename.lastIndexOf('.'));
        this.service_url_prefix = '/debug-services/' + this.module_name.split('_').join('/');

        option = option || {};

        this.logger = require('log4js').getLogger(this.filename);

        if (!this.logger) {
            console.error('logger not loaded in ' + this.file);
        }
        else {
            this.logger.info(this.file + " loaded!");
        }

        function ensureClient(){
            if(!self.soapClient){
                console.log(1)
                return new Promise(function(resolve,reject){
                    soap.createClient('http://open.12301dev.com/openService/MXSE_beta.wsdl',function(err,client){
                        if(!err){
                            console.log(2.1)
                            self.soapClient = client;
                            resolve();
                        }
                        else{
                            console.log(2.2)
                            reject(err);
                        }
                    });
                });
            }

            return Promise.when();
        }


        // var ac = '13003673092',pw='gxr888';
        var ac = '100019',pw='jjl4yk11f82ce6c0f33a5c003f2fec56';

        //_[action]_格式的算是初始化步骤的action，禁止删除
        this.actions = [
            {
                method: 'parse',
                verb: 'get',
                url: this.service_url_prefix + "/parse",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            // var createClient = app.wrapper.cb(soap.createClient);
                            // self.soapClient = yield createClient('http://open.12301dev.com/openService/MXSE_beta.wsdl');

                            // soap.createClient('http://121.43.119.39/open/openService/MXSE.wsdl', function(err, client) {
                            //     console.log(client);
                            //     self.soapClient = client;
                            // });
                            yield ensureClient();

                            console.log(self.soapClient.describe().PFTMX.PFTMXPort.Get_Ticket_List);


                            this.body = 'ok';
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'Get_ScenicSpot_List',
                verb: 'get',
                url: this.service_url_prefix + "/Get_ScenicSpot_List",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            yield ensureClient();
                            console.log('-----------Get_ScenicSpot_List---------------------');
                            var param = {ac: ac, pw: pw, n: 1000};
                            var dlGet_ScenicSpot_List = app.wrapper.cb(self.soapClient.Get_ScenicSpot_List);
                            var rets = yield dlGet_ScenicSpot_List(param);
                            var dlxml2js = app.wrapper.cb(xml2js.parseString);
                            var ret = yield dlxml2js(rets[0].Get_ScenicSpot_List.$value, { explicitArray : false, ignoreAttrs : true });

                            // self.soapClient.Get_ScenicSpot_List(param, function(err, result, raw, soapHeader) {
                            //     // result is a javascript object
                            //     // raw is the raw response
                            //     // soapHeader is the response soap header as a javascript object
                            //
                            //     console.log(result.Get_ScenicSpot_List.$value);
                            //
                            //     xml2js.parseString(result.Get_ScenicSpot_List.$value, { explicitArray : false, ignoreAttrs : true }, function(err2,result2){
                            //        console.log(JSON.stringify(result2));
                            //     });
                            // })

                            this.body = ret;
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'Get_Ticket_List',
                verb: 'get',
                url: this.service_url_prefix + "/Get_Ticket_List",
                handler: function (app, options) {
                    return function * (next) {
                        try {


                            // var myMethod = app.wrapper.cb(self.soapClient.Get_ScenicSpot_List);
                            // var ret = yield myMethod(param);
                            yield ensureClient();

                            var param = {ac:ac,pw:pw,n:15377};
                            console.log('-----------Get_Ticket_List---------------------');
                            self.soapClient.Get_Ticket_List(param, function(err, result, raw, soapHeader) {
                                // result is a javascript object
                                // raw is the raw response
                                // soapHeader is the response soap header as a javascript object
                                console.log(err);
                                console.log(result);
                            })

                            this.body = 'ok';
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
