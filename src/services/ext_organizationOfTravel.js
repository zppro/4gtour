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
                method: 'saveIDCConfigInfo',
                verb: 'post',
                url: this.service_url_prefix + "/saveIDCConfigInfo",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var rows = this.request.body;//[{where:{...},value:''},{where:{...},value:''}]
                            console.log(rows);

                            for(var i= 0;i< rows.length;i++) {
                                var scenicSpot_config = yield app.modelFactory().model_one(app.models['trv_idc_config'], {
                                    where: rows[i].where
                                });

                                if (scenicSpot_config) {
                                    scenicSpot_config.config_value = rows[i].value;
                                    yield scenicSpot_config.save();
                                }
                                else {
                                    yield app.modelFactory().model_create(app.models['trv_idc_config'], app._.extend({}, rows[i].where, {config_value: rows[i].value}));
                                }
                            }

                            this.body = app.wrapper.res.default();
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