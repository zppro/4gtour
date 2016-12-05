/**
 * Created by zppro on 16-11-22.
 * travel related
 */
var rp = require('request-promise-native');
var TRV03 = require('../pre-defined/dictionary.json')['TRV03'];
var DIC = require('../pre-defined/dictionary-constants.json');
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
        
        this.experienceSelect = 'category content imgs location member_id member_name likes stars retweets check_in_time time_description retweet_flag retweet_root';
        this.scenerySpotSelectInExperienceRoute = 'show_name level runtime address tel tip traffic introduction_simple';

        this.actions = [
            {
                method: 'experiencesHot',
                verb: 'post',
                url: this.service_url_prefix + "/experiencesHot",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var member_id = this.payload.member.member_id;
                            var rawRows = yield app.modelFactory().model_query(app.models['trv_experience'], {
                                    where: {status: 1, cancel_flag: 0, who_can_see: DIC.TRV01.OPEN},
                                    select: self.experienceSelect,
                                    sort: {likes: -1, check_in_time: -1}
                                },
                                {limit: this.request.body.page.size, skip: this.request.body.page.skip})
                                .populate('retweet_root');

                            var rows = [];
                            if (rawRows.length > 0) {
                                var row_ids = app._.map(rawRows,function(o){return o.id});

                                var theActions = yield app.modelFactory().model_query(app.models['trv_action'],
                                    {
                                        where:{subject_type:DIC.TRV04.MEMBER, object_type: DIC.TRV04.EXPERIENCE, object_id:{$in: row_ids }},
                                        select:'object_id action_type subject_id'
                                    });
                                for(var i=0;i<rawRows.length;i++){
                                    var row = rawRows[i].toObject();
                                    row.liked = app._.some(theActions, function (action) {
                                        return action.subject_id == member_id && action.action_type == DIC.TRV05.LIKE && action.object_id == row.id
                                    });
                                    row.stared = app._.some(theActions, function (action) {
                                        return action.subject_id == member_id && action.action_type == DIC.TRV05.STAR && action.object_id == row.id
                                    });
                                    row.member_head_portrait = yield app.member_service.getHeadPortrait(row.member_id);
                                    if(app._.isObject(row.retweet_root)){
                                        row.retweet_root.member_head_portrait = yield app.member_service.getHeadPortrait(row.retweet_root.member_id)
                                    }
                                    rows.push(row)
                                }
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
                            var rows = yield app.member_service.getExperienceTweeted(member_id, this.request.body.page);
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
                            var rows = yield app.member_service.getExperienceStared(member_id, this.request.body.page);
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
                method: 'experiencesTaTweeted',
                verb: 'post',
                url: this.service_url_prefix + "/experiencesTaTweeted/:member_id",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var member_id = this.params.member_id;
                            var rows = yield app.member_service.getExperienceTweeted(member_id, this.request.body.page);
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
                method: 'experiencesTaStared',
                verb: 'post',
                url: this.service_url_prefix + "/experiencesTaStared/:member_id",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var member_id = this.params.member_id;
                            var rows = yield app.member_service.getExperienceStared(member_id, this.request.body.page);
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
                                experienceInfo = experience.toObject();
                                routes = experienceInfo.route;

                            } else {
                                routes = [];
                                var scenerySpot1 = yield app.modelFactory().model_one(app.models['trv_scenerySpot'], { where:{_id:'5837d214bf551b671e3d8897'},select: self.scenerySpotSelectInExperienceRoute});
                                routes.push({
                                    type: 'A0001',
                                    imgs: ['http://img2.okertrip.com/190x190-1-raw.jpg','http://img2.okertrip.com/190x190-2-raw.jpg','http://img2.okertrip.com/190x190-3-raw.jpg'],
                                    content: ' 90年代在六和塔近旁新建“中华古塔博览苑”，将中国各地著名的塔缩微雕刻而成，集中展示了古代汉族建筑文化的成就。',
                                    time_consuming: 'A0007',
                                    order_no: 1,
                                    scenerySpotInfo: scenerySpot1 || {}
                                });
                                routes.push({
                                    type: 'A0003',
                                    content: '乘坐公交Y2线，从X站上车，途径3站到Y站下车，步行500米',
                                    time_consuming: 'A0005',
                                    order_no: 1.5,
                                    scenerySpotInfo:{}
                                });
                                var scenerySpot2 = yield app.modelFactory().model_one(app.models['trv_scenerySpot'], { where:{_id:'5837d3e0bf551b671e3d8899'},select: self.scenerySpotSelectInExperienceRoute});
                                routes.push({
                                    type: 'A0001',
                                    imgs: ['http://img2.okertrip.com/190x190-4-raw.jpg','http://img2.okertrip.com/190x190-5-raw.jpg','http://img2.okertrip.com/190x190-6-raw.jpg'],
                                    content: '大型歌舞宋城千古情演出、瓦子勾栏百戏、七十二行老作坊、失落古城、两大鬼屋、江南第一怪街等项目',
                                    time_consuming: 'A0009',
                                    order_no: 2,
                                    scenerySpotInfo: scenerySpot2 || {}
                                });
                                experienceInfo = {
                                    id: 'testxxx',
                                    imgs: [],
                                    content: '这是一个路线',
                                    routes: routes
                                }
                            }

                            app._.each(routes,function(o){
                               o.time_consuming = TRV03[o.time_consuming].name;
                            });

                            this.body = app.wrapper.res.ret(experienceInfo);
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
                verb: 'post',
                url: this.service_url_prefix + "/experience",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var experience = app._.extend({
                                who_can_see: 'A0001'
                            }, this.payload.member, this.request.body);
                            if (experience.retweet_flag) {
                                //转发的
                                var content = experience.content.replace(/\s*/gi,'');
                                experience.pure_content = content;
                                experience.content = yield app.member_service.addHrefToName(content);
                            }
                            this.body = app.wrapper.res.ret(yield app.modelFactory().model_create(app.models['trv_experience'], experience));

                            if (experience.retweet_flag) {
                                for (var i = 0; i < experience.retweet_chains.length; i++) {
                                    var retweet_experience_id = experience.retweet_chains[i];
                                    var retweet_experience = yield app.modelFactory().model_read(app.models['trv_experience'], retweet_experience_id);
                                    if (retweet_experience) {
                                        yield app.modelFactory().model_create(app.models['trv_action'], {
                                            subject_type: DIC.TRV04.MEMBER,
                                            subject_id: experience.member_id,
                                            action_type: DIC.TRV05.RETWEET,
                                            object_type: DIC.TRV04.EXPERIENCE,
                                            object_id: retweet_experience_id
                                        });
                                        retweet_experience.retweets += 1;
                                        yield retweet_experience.save();
                                    }
                                }
                            }

                        } catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'experience',
                verb: 'put',
                url: this.service_url_prefix + "/experience/:experienceId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var ret = yield app.modelFactory().model_update(app.models['trv_experience'], this.params.experienceId, this.request.body);
                            var experience = yield app.modelFactory().model_read(app.models['trv_experience'], this.params.experienceId);
                            this.body = app.wrapper.res.ret(experience);
                        } catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'experienceLike',
                verb: 'post',
                url: this.service_url_prefix + "/experienceLike/:experienceId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var experience = yield app.modelFactory().model_read(app.models['trv_experience'], this.params.experienceId);
                            if (!experience) {
                                this.body = app.wrapper.res.error({code: 51001, message: 'invalid experience'});
                                yield next;
                                return;
                            }
                            var member_id = this.payload.member.member_id;
                            yield app.modelFactory().model_create(app.models['trv_action'], {
                                subject_type: DIC.TRV04.MEMBER,
                                subject_id: member_id,
                                action_type: DIC.TRV05.LIKE,
                                object_type: DIC.TRV04.EXPERIENCE,
                                object_id: this.params.experienceId
                            });
                            experience.likes += 1;
                            yield experience.save();
                            this.body = app.wrapper.res.ret({id: experience._id, likes: experience.likes, liked: true});
                        } catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'experienceUnLike',
                verb: 'post',
                url: this.service_url_prefix + "/experienceUnLike/:experienceId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var experience = yield app.modelFactory().model_read(app.models['trv_experience'], this.params.experienceId);
                            if (!experience) {
                                this.body = app.wrapper.res.error({code: 51001, message: 'invalid experience'});
                                yield next;
                                return;
                            }
                            var member_id = this.payload.member.member_id;
                            var actions = yield app.modelFactory().model_query(app.models['trv_action'], {
                                where: {
                                    subject_type: DIC.TRV04.MEMBER,
                                    subject_id: member_id,
                                    action_type: DIC.TRV05.LIKE,
                                    object_type: DIC.TRV04.EXPERIENCE,
                                    object_id: this.params.experienceId
                                }
                            });
                            var length = actions.length;
                            for (var i = 0; i < length; i++) {
                                actions[i].remove();
                            }
                            experience.likes -= length;
                            yield experience.save();
                            this.body = app.wrapper.res.ret({id: experience._id, likes: experience.likes, liked: false});
                        } catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'experienceStar',
                verb: 'post',
                url: this.service_url_prefix + "/experienceStar/:experienceId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var experience = yield app.modelFactory().model_read(app.models['trv_experience'], this.params.experienceId);
                            if (!experience) {
                                this.body = app.wrapper.res.error({code: 51001, message: 'invalid experience'});
                                yield next;
                                return;
                            }
                            var member_id = this.payload.member.member_id;
                            yield app.modelFactory().model_create(app.models['trv_action'], {
                                subject_type: DIC.TRV04.MEMBER,
                                subject_id: member_id,
                                action_type: DIC.TRV05.STAR,
                                object_type: DIC.TRV04.EXPERIENCE,
                                object_id: this.params.experienceId
                            });
                            experience.stars += 1;
                            yield experience.save();
                            this.body = app.wrapper.res.ret({id: experience._id, stars: experience.stars, stared: true});
                        } catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'experienceUnStar',
                verb: 'post',
                url: this.service_url_prefix + "/experienceUnStar/:experienceId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var experience = yield app.modelFactory().model_read(app.models['trv_experience'], this.params.experienceId);
                            if (!experience) {
                                this.body = app.wrapper.res.error({code: 51001, message: 'invalid experience'});
                                yield next;
                                return;
                            }
                            var member_id = this.payload.member.member_id;
                            var actions = yield app.modelFactory().model_query(app.models['trv_action'], {
                                where: {
                                    subject_type: DIC.TRV04.MEMBER,
                                    subject_id: member_id,
                                    action_type: DIC.TRV05.STAR,
                                    object_type: DIC.TRV04.EXPERIENCE,
                                    object_id: this.params.experienceId
                                }
                            });
                            var length = actions.length;
                            for (var i = 0; i < length; i++) {
                                actions[i].remove();
                            }
                            experience.stars -= length;
                            yield experience.save();
                            this.body = app.wrapper.res.ret({id: experience._id, stars: experience.stars, stared: false});
                        } catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'member',
                verb: 'get',
                url: this.service_url_prefix + "/member/:memberId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var member = yield app.modelFactory().model_one(app.models['trv_member'], {where: {code: this.params.memberId}, select: 'code name head_portrait'});
                            if (!member) {
                                this.body = app.wrapper.res.error({code: 51002, message: 'invalid member'});
                                yield next;
                                return;
                            }
                            this.body = app.wrapper.res.ret(member);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'scenerySpotsAll',
                verb: 'post',
                url: this.service_url_prefix + "/scenerySpotsAll",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var rows = yield app.modelFactory().model_query(app.models['trv_scenerySpot'], {
                                    where: {status: 1},
                                    select: 'show_name img',
                                    sort: {show_name: 1}
                                });
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
                method: 'scenerySpots',
                verb: 'post',
                url: this.service_url_prefix + "/scenerySpots",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var rows = yield app.modelFactory().model_query(app.models['trv_scenerySpot'], {
                                    where: {status: 1},
                                    sort: {show_name: 1}
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
            }
        ];

        return this;
    }
}.init();
//.init(option);