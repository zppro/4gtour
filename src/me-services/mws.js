/**
 * Created by zppro on 17-1-9.
 * travel related
 */
var rp = require('request-promise-native');
var DIC = require('../pre-defined/dictionary-constants.json');
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
                method: 'spus',
                verb: 'post',
                url: this.service_url_prefix + "/spus",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var where = {status: 1, cancel_flag: 0};
                            var rows = yield app.modelFactory().model_query(app.models['mws_spu'], {
                                    where: where,
                                    select: 'name imgs skus',
                                    sort: {name: 1}
                                },
                                {limit: this.request.body.page.size, skip: this.request.body.page.skip});
                            console.log(this.request.body);
 
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
                method: 'spu',
                verb: 'get',
                url: this.service_url_prefix + "/spu/:spuId",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var spu = yield app.modelFactory().model_read(app.models['mws_spu'], this.params.spuId);
                            this.body = app.wrapper.res.ret(spu);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'order-create',
                verb: 'post',
                url: this.service_url_prefix + "/order",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var order = app._.extend({
                                order_status: DIC.MWS01.NOT_PAY
                            }, this.request.body);
                            var created = yield app.modelFactory().model_create(app.models['mws_order'], order);
                            this.body = app.wrapper.res.ret(created);
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
                method: 'order-update',
                verb: 'put',
                url: this.service_url_prefix + "/order/:orderId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            yield app.modelFactory().model_update(app.models['mws_order'], this.params.orderId, this.request.body);
                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            console.log(e);
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