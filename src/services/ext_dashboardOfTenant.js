/**
 * Created by zppro on 16-10-11.
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
                method: 'deviceStatInfo',
                verb: 'get',
                url: this.service_url_prefix + "/deviceStatInfo",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var deviceQuantity = yield  app.modelFactory().model_totals(app.models['pub_deviceAccess']);
                            var begin = app.moment(app.moment().startOf('month').format('YYYY-MM-DD')+" 00:00:00");
                            var end = app.moment(app.moment().endOf('month').format('YYYY-MM-DD')+" 23:59:59");
                            var deviceQuantityCurrentMonth = yield app.modelFactory().model_totals(app.models['pub_deviceAccess'], {
                                check_in_time: {"$gte": begin, "$lte": end}
                            });
                            var deviceAccessTimes = yield app.modelFactory().model_aggregate(app.models['pub_deviceAccess'], [
                                {
                                    $match: {
                                        app_id: 'A0001'
                                    }
                                },
                                {
                                    $group: {
                                        _id: '$app_id',
                                        count: {$sum: '$access_times'}
                                    }
                                }
                            ]);
                            var device_access_times = app._.reduce(deviceAccessTimes, function(sum, item){ return sum + item.count; }, 0);
                            var result = { device_quantity: deviceQuantity.length, device_quantity_current_month: deviceQuantityCurrentMonth.length, device_access_times: device_access_times }
                            this.body = app.wrapper.res.ret(result);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            }
            /*************************************************************/

        ];

        return this;
    }
}.init();
//.init(option);