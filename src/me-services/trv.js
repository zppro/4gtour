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
        
        this.experienceSelect = 'category content imgs location member_id,member_name,likes,stars,retweets,check_in_time,time_description';

        this.actions = [
            {
                method: 'experiencesHot',
                verb: 'post',
                url: this.service_url_prefix + "/experiencesHot",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var rows = yield app.modelFactory().model_query(app.models['trv_experience'], {
                                    where: {status: 1, cancel_flag: 0, who_can_see: 'A0001'},
                                    select: self.experienceSelect,
                                    sort: {likes: -1}
                                },
                                {limit: this.request.body.page.size, skip: this.request.body.page.skip});

                            if (rows.length==0) {
                                rows.push({
                                    id: 'test2',
                                    check_in_time: app.moment(),
                                    category: 'A0001',
                                    content: '待到山花烂原野，成就最好的自己。昨晚很荣幸与大师合作，希望美妙的音乐能给大家带来欢乐！',
                                    imgs: ['http://img2.okertrip.com/190x190-1-@2x.jpg','http://img2.okertrip.com/190x190-2-@2x.jpg',
                                        'http://img2.okertrip.com/190x190-3-@2x.jpg','http://img2.okertrip.com/190x190-4-@2x.jpg',
                                        'http://img2.okertrip.com/190x190-5-@2x.jpg','http://img2.okertrip.com/190x190-6-@2x.jpg'],
                                    location: '杭州',
                                    time_description: '1小时前',
                                    member_id: 'sjygw',
                                    member_name: '四季游官网',
                                    member_head_portrait: 'http://img2.okertrip.com/70x70-1-@2x.jpg',
                                    likes:24,
                                    stars:10,
                                    retweets:0
                                });
                                rows.push({
                                    id: 'test1',
                                    check_in_time: app.moment(),
                                    category: 'A0002',
                                    content: '待到山花烂原野，成就最好的自己。昨晚很荣幸与大师合作，希望美妙的音乐能给大家带来欢乐！',
                                    imgs: ['http://img2.okertrip.com/190x190-1-@2x.jpg','http://img2.okertrip.com/190x190-2-@2x.jpg',
                                        'http://img2.okertrip.com/190x190-3-@2x.jpg','http://img2.okertrip.com/190x190-4-@2x.jpg',
                                        'http://img2.okertrip.com/190x190-5-@2x.jpg','http://img2.okertrip.com/190x190-6-@2x.jpg'],
                                    location: '杭州',
                                    time_description: '2小时前',
                                    member_id: 'sjygw',
                                    member_name: '四季游官网',
                                    member_head_portrait: 'http://img2.okertrip.com/70x70-2-@2x.jpg',
                                    likes:33,
                                    stars:5,
                                    retweets:12
                                })
                            }

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
                method: 'experiencesMyTweeted',
                verb: 'post',
                url: this.service_url_prefix + "/experiencesMyTweeted",
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

                            if (rows.length==0) {
                                rows.push({
                                    id: 'test4',
                                    check_in_time: app.moment(),
                                    category: 'A0001',
                                    content: '待到山花烂原野，成就最好的自己。昨晚很荣幸与大师合作，希望美妙的音乐能给大家带来欢乐！',
                                    imgs: ['http://img2.okertrip.com/190x190-1-@2x.jpg','http://img2.okertrip.com/190x190-2-@2x.jpg',
                                        'http://img2.okertrip.com/190x190-3-@2x.jpg','http://img2.okertrip.com/190x190-4-@2x.jpg',
                                        'http://img2.okertrip.com/190x190-5-@2x.jpg','http://img2.okertrip.com/190x190-6-@2x.jpg'],
                                    location: '杭州',
                                    time_description: '5分钟前',
                                    member_id: 'sjygw',
                                    member_name: '四季游官网',
                                    member_head_portrait: 'http://img2.okertrip.com/70x70-1-@2x.jpg',
                                    likes:24,
                                    stars:10,
                                    retweets:0
                                });
                                rows.push({
                                    id: 'test3',
                                    check_in_time: app.moment(),
                                    category: 'A0002',
                                    content: '待到山花烂原野，成就最好的自己。昨晚很荣幸与大师合作，希望美妙的音乐能给大家带来欢乐！',
                                    imgs: ['http://img2.okertrip.com/190x190-1-@2x.jpg','http://img2.okertrip.com/190x190-2-@2x.jpg',
                                        'http://img2.okertrip.com/190x190-3-@2x.jpg','http://img2.okertrip.com/190x190-4-@2x.jpg',
                                        'http://img2.okertrip.com/190x190-5-@2x.jpg','http://img2.okertrip.com/190x190-6-@2x.jpg'],
                                    location: '杭州',
                                    time_description: '2分钟前',
                                    member_id: 'sjygw',
                                    member_name: '四季游官网',
                                    member_head_portrait: 'http://img2.okertrip.com/70x70-2-@2x.jpg',
                                    likes:33,
                                    stars:5,
                                    retweets:12
                                })
                            }
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
                method: 'experiencesMyStared',
                verb: 'post',
                url: this.service_url_prefix + "/experiencesMyStared",
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