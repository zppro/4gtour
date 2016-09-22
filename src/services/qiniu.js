/**
 * qiuniu Created by zppro on 16-9-12.
 * Target:用途
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

        qiniu.conf.ACCESS_KEY = 'icuD_ORmQEtx79qweXz60YEJPvuMN9XYjOWUZG_s';
        qiniu.conf.SECRET_KEY = 'adLkjl-7Velkq-3BjyCccrcJZhjQzH6VyAs7DK6t';

        var default_bucket = '4gimg';

        this.actions = [
            {
                method: 'uploadToken',
                verb: 'get',
                url: this.service_url_prefix + "/uploadToken/:user,:bucket,:key?",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var bucket = this.params.bucket || default_bucket;
                            var key = this.params.key;
                            var user = this.params.user;

                            var pubPolicyObj = {
                                scope: key ? bucket + ':' + key : bucket,
                                expire: app.moment().add(1, 'day'),
                                endUser: user
                            };
                            var pubPolicy = new qiniu.rs.PutPolicy2(pubPolicyObj);

                            this.set("Cache-Control", "max-age=0, private, must-revalidate");
                            this.set("Pragma", "no-cache");
                            this.set("Expires", 0);
                            this.set('Parse','no-parse');
                            
                            this.body = {uptoken: pubPolicy.token()};
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