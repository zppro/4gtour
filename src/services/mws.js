/**
 * idt Created by zppro on 17-1-16.
 * 网上商城web接口
 */
var DIC = require('../pre-defined/dictionary-constants.json');
module.exports = {
    init: function (option) {
        var self = this;
        this.file = __filename;
        this.filename = this.file.substr(this.file.lastIndexOf('/') + 1);
        this.module_name = this.filename.substr(0, this.filename.lastIndexOf('.'));
        this.service_url_prefix = '/services/' + this.module_name.split('_').join('/');
        this.log_name = 'svc_' + this.filename;
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
                method: 'ship',
                verb: 'post',
                url: this.service_url_prefix + "/ship/:orderId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var shipInfo = app._.extend({
                                order_status: DIC.MWS01.SHIPPING,
                                logistics_time: app.moment()
                            }, this.request.body);
                            console.log(shipInfo);
                            yield app.modelFactory().model_update(app.models['mws_order'], this.params.orderId, shipInfo);
                            this.body = app.wrapper.res.default();
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