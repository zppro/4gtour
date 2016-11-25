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
        this.scenerySpotSelectInExperienceRoute = 'show_name level runtime address tel tip traffic introduction_simple';

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
                                    category: 'A0003',
                                    content: '宋城——>六和塔',
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
                                    category: 'A0001',
                                    content: '待到山花烂原野，成就最好的自己。昨晚很荣幸与大师合作，希望美妙的音乐能给大家带来欢乐！',
                                    imgs: ['http://img2.okertrip.com/190x190-1-@2x.jpg','http://img2.okertrip.com/190x190-2-@2x.jpg',
                                        'http://img2.okertrip.com/190x190-3-@2x.jpg','http://img2.okertrip.com/190x190-4-@2x.jpg'],
                                    location: '杭州',
                                    time_description: '2小时前',
                                    member_id: 'sjygw',
                                    member_name: '四季游官网',
                                    member_head_portrait: 'http://img2.okertrip.com/70x70-2-@2x.jpg',
                                    likes:33,
                                    stars:5,
                                    retweets:12
                                })
                                rows.push({
                                    id: 'test0',
                                    check_in_time: app.moment(),
                                    category: 'A0001',
                                    content: '待到山花烂原野，成就最好的自己。昨晚很荣幸与大师合作，希望美妙的音乐能给大家带来欢乐！',
                                    imgs: ['http://img2.okertrip.com/190x190-1-@2x.jpg'],
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
                                    category: 'A0003',
                                    content: '六和塔——>宋城',
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
                                        subject_type: 'A0003',
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

                            var rows = app._.map(actions, function(action){
                                return action.object_id
                            });

                            if (rows.length==0) {
                                rows.push({
                                    id: 'test5',
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
                                    likes:124,
                                    stars:233,
                                    retweets:35
                                });
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
                method: 'experience',
                verb: 'get',
                url: this.service_url_prefix + "/experience/:experienceId",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var experience = yield app.modelFactory().model_read(app.models['trv_experience'], this.params.experienceId);
                            var experienceInfo;
                            var routes;
                            if (experience) {
                                routes = experience.route;
                            } else {
                                routes = [];
                                var scenerySpot1 = yield app.modelFactory().model_one(app.models['trv_scenerySpot'], { where:{_id:'5837d46d30452737c6710981'},select: self.scenerySpotSelectInExperienceRoute});
                                routes.push({
                                    type: 'A0001',
                                    imgs: ['http://img2.okertrip.com/190x190-1-raw.jpg','http://img2.okertrip.com/190x190-2-raw.jpg','http://img2.okertrip.com/190x190-3-raw.jpg'],
                                    content: ' 90年代在六和塔近旁新建“中华古塔博览苑”，将中国各地著名的塔缩微雕刻而成，集中展示了古代汉族建筑文化的成就。',
                                    time_consuming: 'A0007',
                                    order_no: 1,
                                    scenerySpotInfo: scenerySpot1
                                });
                                routes.push({
                                    type: 'A0003',
                                    content: '乘坐公交Y2线，从X站上车，途径3站到Y站下车，步行500米',
                                    time_consuming: 'A0005',
                                    order_no: 2
                                });
                                var scenerySpot2 = yield app.modelFactory().model_one(app.models['trv_scenerySpot'], { where:{_id:'5837d4a530452737c6710983'},select: self.scenerySpotSelectInExperienceRoute});
                                routes.push({
                                    type: 'A0001',
                                    imgs: ['http://img2.okertrip.com/190x190-4-raw.jpg','http://img2.okertrip.com/190x190-5-raw.jpg','http://img2.okertrip.com/190x190-6-raw.jpg'],
                                    content: '大型歌舞宋城千古情演出、瓦子勾栏百戏、七十二行老作坊、失落古城、两大鬼屋、江南第一怪街等项目',
                                    time_consuming: 'A0009',
                                    order_no: 3,
                                    scenerySpotInfo: scenerySpot2
                                });
                                experienceInfo = {
                                    id: 'testxxx',
                                    imgs: [],
                                    content: '这是一个路线',
                                    routes: routes
                                }
                            }

                            this.body = app.wrapper.res.ret(experienceInfo);
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