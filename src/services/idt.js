/**
 * idt Created by zppro on 16-9-20.
 * Target:与第三方进行接口数据交换
 */

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
                method: 'PFT$Callback',
                verb: 'get',
                url: this.service_url_prefix + "/PFT$Callback",
                handler: function (app, options) {
                    return function *(next) {
                        try {

                            this.body = 'success'
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = e.message;
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'PFT$fetchScenicSpotList',
                verb: 'get',
                url: this.service_url_prefix + "/PFT$fetchScenicSpotList",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var rows =  yield app.pft.fetchScenicSpotList(self.logger,1000);

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
                method: 'PFT$fetchTicket',
                verb: 'get',
                url: this.service_url_prefix + "/PFT$fetchTicket/:scenicSpotId",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var rows =  yield app.pft.fetchTicket(self.logger,Number(this.params.scenicSpotId));
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
                method: 'PFT$syncScenicSpot',
                verb: 'post',
                url: this.service_url_prefix + "/PFT$syncScenicSpot",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            yield app.pft.syncScenicSpot(self.logger);
                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'PFT$syncTicket',
                verb: 'post',
                url: this.service_url_prefix + "/PFT$syncTicket/:scenicSpotId?",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            yield app.pft.syncTicket(self.logger,this.params.scenicSpotId);
                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'PFT$issueTicket',
                verb: 'post',
                url: this.service_url_prefix + "/PFT$issueTicket/:orderId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var wrapperRet = yield app.pft.issueTicket(self.logger,this.params.orderId);
                            this.body = wrapperRet;
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'PFT$refundForTicket',
                verb: 'post',
                url: this.service_url_prefix + "/PFT$refundForTicket/:orderId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var wrapperRet = yield app.pft.refundForTicket(self.logger,this.params.orderId);
                            this.body = wrapperRet;
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'PFT$refreshOrderInfo',
                verb: 'post',
                url: this.service_url_prefix + "/PFT$refreshOrderInfo/:orderId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var wrapperRet = yield app.pft.refreshOrderInfo(self.logger,this.params.orderId);
                            this.body = wrapperRet;
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'PFT$resendSmsForOrder',
                verb: 'post',
                url: this.service_url_prefix + "/PFT$resendSmsForOrder/:orderId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var wrapperRet = yield app.pft.reSendSms(self.logger,this.params.orderId);
                            this.body = wrapperRet;
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