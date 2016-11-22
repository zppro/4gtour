/**
 * Created by zppro on 16-11-22.
 * travel related
 */
var rp = require('request-promise-native');

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
        
        this.experienceSelect = 'content imgs location member_id,member_name,likes,stars,retweets,check_in_time,time_description';

        this.actions = [
            {
                method: 'experienceByLikeForEver',
                verb: 'post',
                url: this.service_url_prefix + "/experienceByLikeForEver",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var rows = yield app.modelFactory().model_query(app.models['trv_experience'], {
                                    where: {status: 1, cancel_flag: 0, who_can_see: 'A0001'},
                                    select: self.experienceSelect,
                                    sort: {likes: -1}
                                },
                                {limit: this.request.body.page.size, skip: this.request.body.page.skip});

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
                method: 'experienceByMyTweeted',
                verb: 'post',
                url: this.service_url_prefix + "/experienceByMyTweeted",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var member_id = this.payload.member.member_id;
                            var rows = yield app.modelFactory().model_query(app.models['trv_experience'], {
                                    where: {status: 1, cancel_flag: 0, member_id: member_id},
                                    select: self.experienceSelect,
                                    sort: {check_in_time: -1}
                                },
                                {limit: this.request.body.page.size, skip: this.request.body.page.skip});

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
                method: 'experienceByMyStared',
                verb: 'post',
                url: this.service_url_prefix + "/experienceByMyStared",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var member_id = this.payload.member.member_id;
                            var actions = yield app.modelFactory().model_query(app.models['trv_action'], {
                                    where: {
                                        subject_type: 'A0001',
                                        subject_id: member_id,
                                        action_type: 'A0005',
                                        object_type: 'A0002'
                                    },
                                    select: 'object_id',
                                    sort: {check_in_time: -1}
                                },
                                {limit: this.request.body.page.size, skip: this.request.body.page.skip})
                                .populate({
                                    path: 'object_id',
                                    select: self.experienceSelect,
                                    model: 'trv_experience',
                                    match: {status: 1, cancel_flag: 0}
                                });

                            var rows = _.map(actions, function(action){
                                return action.object_id
                            });

                            this.body = app.wrapper.res.rows(rows);
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