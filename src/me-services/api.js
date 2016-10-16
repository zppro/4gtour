/**
 * Created by zppro on 16-10-12.
 * api for mobile web app
 */

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
                method: 'scenicSpots',
                verb: 'get',
                url: this.service_url_prefix + "/scenicSpots",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var lowPriceTicketsPerScenicSpot = yield app.modelFactory().model_aggregate(app.models['idc_ticket_PFT'], [
                                // {
                                //     $match: {
                                //         status: 1
                                //     }
                                // },
                                {
                                    $group: {
                                        _id: '$UUlid',
                                        price: {$min: '$sale_price'}
                                    }
                                },
                                {$sort: {"price": 1}},
                                {
                                    $project: {
                                        scenicSpotId: '$_id.UUlid',
                                        price: '$price',
                                        _id: 0
                                    }
                                }
                            ]);

                            console.log(lowPriceTicketsPerScenicSpot)
                            
                            this.body = app.wrapper.res.ret(lowPriceTicketsPerScenicSpot);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'auth',
                verb: 'get',
                url: this.service_url_prefix + "/auth",
                handler: function (app, options) {
                    return function * (next) {
                        try {
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
                method: 'hb',
                verb: 'get',
                url: this.service_url_prefix + "/hb",
                handler: function (app, options) {
                    return function * (next) {
                        try {
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
                method: 'tpost',
                verb: 'post',
                url: this.service_url_prefix + "/tpost",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            console.log(this.request.body);
                            this.body = app.wrapper.res.ret(this.request.body);
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