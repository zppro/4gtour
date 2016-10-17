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
                                {
                                    $match: {
                                        status: 1
                                    }
                                },
                                {
                                    $group: {
                                        _id: {UUlid: '$UUlid'},
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

                            var rows_ScenicSpot = yield app.modelFactory().model_query(app.models['idc_scenicSpot_PFT'],{ where: { status:1 }, select: 'UUid show_name UUimgpath UUaddress'});

                            var rows = app._.map(rows_ScenicSpot,function(o) {
                                var price = app._.find(lowPriceTicketsPerScenicSpot, function (item) {
                                    return item.scenicSpotId == o.UUid
                                }).price;
                                return {id:o.id, UUid: o.UUid, title: o.show_name, img: o.UUimgpath, price: price, description: o.UUaddress}
                            });

                            console.log(rows);
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
                method: 'scenicSpot',
                verb: 'get',
                url: this.service_url_prefix + "/scenicSpot/:scenicSpotId",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var scenicSpotId = this.params.scenicSpotId;
                            console.log(scenicSpotId)
                            

                            var scenicSpot = yield app.modelFactory().model_read(app.models['idc_scenicSpot_PFT'],scenicSpotId);
                            var ticketsOfScenicSpot = yield app.modelFactory().model_query(app.models['idc_ticket_PFT'],{ where: { status:1,UUlid: scenicSpot.UUid }, select: 'UUlid UUid show_name sale_price UUtprice'});

                            var ret = {
                                id: scenicSpot._id,
                                img: scenicSpot.UUimgpath,
                                title: scenicSpot.show_name,
                                buy_quantity: 1,
                                level: scenicSpot.UUjtype,
                                tickets_count: ticketsOfScenicSpot.length,
                                address: scenicSpot.UUaddress,
                                runtime: scenicSpot.UUruntime,
                                tip: scenicSpot.UUjqts,
                                travel_guide: scenicSpot.UUjtzn
                            };
 
                            var ticketWithMinSalePrice = app._.min(ticketsOfScenicSpot,function(o) {
                                return o.sale_price
                            });
                            
                            if(ticketWithMinSalePrice){
                                ret.selected_ticket_id = ticketWithMinSalePrice._id;
                                ret.selected_ticket_uulid = ticketWithMinSalePrice.UUlid;
                                ret.selected_ticket_uuid = ticketWithMinSalePrice.UUid;
                                ret.selected_ticket_price = ticketWithMinSalePrice.sale_price;
                                ret.selected_ticket_bid_price = ticketWithMinSalePrice.UUtprice;
                                ret.selected_ticket_name = ticketWithMinSalePrice.show_name;
                            }
                            console.log(ret);
                            this.body = app.wrapper.res.ret(ret);
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