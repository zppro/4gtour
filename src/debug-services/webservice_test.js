/**
 * init Created by zppro on 16-9-19.
 * Target:初始化基本数据
 */

var soap = require('soap');

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


        var ac = '13003673092',pw='gxr888';


        //_[action]_格式的算是初始化步骤的action，禁止删除
        this.actions = [
            {
                method: 'parse',
                verb: 'get',
                url: this.service_url_prefix + "/parse",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var createClient = app.wrapper.cb(soap.createClient);
                            self.soapClient = yield createClient('http://121.43.119.39/open/openService/MXSE.wsdl');

                            // soap.createClient('http://121.43.119.39/open/openService/MXSE.wsdl', function(err, client) {
                            //     console.log(client);
                            //     self.soapClient = client;
                            // });

                            console.log(self.soapClient.describe().PFTMX.PFTMXPort.Get_ScenicSpot_List);
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
                    return function * (next) {
                        try {

                            var param = {ac:ac,pw:pw,n:5,m:10};
                            // var myMethod = app.wrapper.cb(self.soapClient.Get_ScenicSpot_List);
                            // var ret = yield myMethod(param);
                            console.log('-----------Get_ScenicSpot_List---------------------');
                            self.soapClient.Get_ScenicSpot_List(param, function(err, result, raw, soapHeader) {
                                // result is a javascript object
                                // raw is the raw response
                                // soapHeader is the response soap header as a javascript object
                                console.log(err);
                                console.log(result);
                                console.log(raw);
                                console.log(soapHeader);
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
