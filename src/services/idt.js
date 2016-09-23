/**
 * idt Created by zppro on 16-9-20.
 * Target:与第三方进行接口数据交换
 */
var qiniu = require('qiniu');

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
                method: 'PFT$fetchScenicSpot',
                verb: 'get',
                url: this.service_url_prefix + "/PFT$fetchScenicSpot",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var rows =  yield app.pft.fetchScenicSpot(self.logger,1000);

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
            }
        ];

        return this;
    }
}.init();
//.init(option);