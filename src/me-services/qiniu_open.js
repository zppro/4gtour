/**
 * qiuniu_open Created by zppro on 16-11-27.
 * Target: 七牛开放平台
 */
var qiniu = require('qiniu');

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

        qiniu.conf.ACCESS_KEY = 'icuD_ORmQEtx79qweXz60YEJPvuMN9XYjOWUZG_s';
        qiniu.conf.SECRET_KEY = 'adLkjl-7Velkq-3BjyCccrcJZhjQzH6VyAs7DK6t';

        var default_bucket = '4gimg';

        this.actions = [
            {
                method: 'uploadToken',
                verb: 'get',
                url: this.service_url_prefix + "/uploadToken/:key?",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var bucket = default_bucket;
                            var key = this.params.key;
                            var member = this.payload.member.member_id;

                            var pubPolicyObj = {
                                scope: key ? bucket + ':' + key : bucket,
                                expire: app.moment().add(1, 'day'),
                                endUser: member
                            };
                            var pubPolicy = new qiniu.rs.PutPolicy2(pubPolicyObj);

                            this.set("Cache-Control", "max-age=0, private, must-revalidate");
                            this.set("Pragma", "no-cache");
                            this.set("Expires", 0);
                            this.set('Parse','no-parse');
                            var token = pubPolicy.token();
                            this.body = app.wrapper.res.ret(token);

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