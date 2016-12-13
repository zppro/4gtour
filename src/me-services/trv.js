/**
 * Created by zppro on 16-11-22.
 * travel related
 */
var rp = require('request-promise-native');
var TRV03 = require('../pre-defined/dictionary.json')['TRV03'];
var DIC = require('../pre-defined/dictionary-constants.json');
var externalSystemConfig = require('../pre-defined/external-system-config.json');
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
                            var experience = yield app.modelFactory().model_read(app.models['trv_experience'], this.params.experienceId).populate('route.scenerySpotId');
                            var experienceInfo;
                            var routes;
                            if (experience) {
                                experienceInfo = experience.toObject();
                                routes = experienceInfo.route;

                            }

                            app._.each(routes,function(o){
                                o.time_consuming = TRV03[o.time_consuming].name;
                                !o.scenerySpotId && (o.scenerySpotId = {})
                            });
                            console.log(experienceInfo)

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
                            var member = yield app.modelFactory().model_one(app.models['trv_member'], {where: {code: this.payload.member.member_id}});
                            if (!member) {
                                this.body = app.wrapper.res.error({code: 51002, message: 'invalid member'});
                                yield next;
                                return;
                            }
                            var experience = app._.extend({
                                who_can_see: 'A0001'
                            }, this.payload.member, this.request.body);
                            if (experience.retweet_flag) {
                                //转发的
                                var content = experience.content.replace(/\s*/gi,'');
                                experience.pure_content = content;
                                experience.content = yield app.member_service.addHrefToName(content);
                            }
                            var created = yield app.modelFactory().model_create(app.models['trv_experience'], experience);

                            var experienceInfo = yield app.modelFactory().model_read(app.models['trv_experience'], created.id).populate('route.scenerySpotId');
                            app._.each(experienceInfo.route,function(o){
                                o.time_consuming = TRV03[o.time_consuming].name;
                                !o.scenerySpotId && (o.scenerySpotId = {})
                            });

                            yield app.modelFactory().model_create(app.models['trv_action'], {
                                subject_type: DIC.TRV04.MEMBER,
                                subject_id: experience.member_id,
                                action_type: DIC.TRV05.TWEET,
                                object_type: DIC.TRV04.EXPERIENCE,
                                object_id: created.id
                            });
                            
                            //更新用户的发布见闻数量
                            member.tweeted += 1;
                            yield member.save();
                            
                            this.body = app.wrapper.res.ret(experienceInfo);

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
                method: 'experience',
                verb: 'delete',
                url: this.service_url_prefix + "/experience/:experienceId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var influenceToExperiencesRetweetChain = []
                            var member = yield app.modelFactory().model_one(app.models['trv_member'], {where: {code: this.payload.member.member_id}});
                            if (!member) {
                                this.body = app.wrapper.res.error({code: 51002, message: 'invalid member'});
                                yield next;
                                return;
                            }

                            var experience = yield app.modelFactory().model_read(app.models['trv_experience'], this.params.experienceId);
                            if (experience.retweet_chains.length > 0) {
                                experiencesRetweetChain = yield app.modelFactory().model_query(app.models['trv_experience'], {
                                    where : {_id: {$in: experience.retweet_chains}}
                                });
                                
                                for (var i=0; i < experiencesRetweetChain.length; i++) {
                                    experiencesRetweetChain[i].retweets -= 1;
                                    yield experiencesRetweetChain[i].save()
                                    influenceToExperiencesRetweetChain.push({id: experiencesRetweetChain[i].id, retweets: experiencesRetweetChain[i].retweets});
                                }
                            }
                            yield app.modelFactory().model_update(app.models['trv_experience'], this.params.experienceId, {status: 0});

                            yield app.modelFactory().model_create(app.models['trv_action'], {
                                subject_type: DIC.TRV04.MEMBER,
                                subject_id: experience.member_id,
                                action_type: DIC.TRV05.REMOVE,
                                object_type: DIC.TRV04.EXPERIENCE,
                                object_id: this.params.experienceId
                            });

                            //更新用户的发布见闻数量
                            member.tweeted -= 1;
                            yield member.save();

                            this.body = app.wrapper.res.rows(influenceToExperiencesRetweetChain);
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
                            var member_id = this.payload.member.member_id;
                            var member = yield app.modelFactory().model_one(app.models['trv_member'], {where: {code: member_id}});
                            if (!member) {
                                this.body = app.wrapper.res.error({code: 51002, message: 'invalid member'});
                                yield next;
                                return;
                            }
                            
                            var experience = yield app.modelFactory().model_read(app.models['trv_experience'], this.params.experienceId);
                            if (!experience) {
                                this.body = app.wrapper.res.error({code: 51001, message: 'invalid experience'});
                                yield next;
                                return;
                            }
                            
                            yield app.modelFactory().model_create(app.models['trv_action'], {
                                subject_type: DIC.TRV04.MEMBER,
                                subject_id: member_id,
                                action_type: DIC.TRV05.STAR,
                                object_type: DIC.TRV04.EXPERIENCE,
                                object_id: this.params.experienceId
                            });
                            experience.stars += 1;
                            yield experience.save();

                            //更新用户的收藏的见闻数量
                            member.stared += 1;
                            yield member.save();
                            
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
                            var member_id = this.payload.member.member_id;
                            var member = yield app.modelFactory().model_one(app.models['trv_member'], {where: {code: member_id}});
                            if (!member) {
                                this.body = app.wrapper.res.error({code: 51002, message: 'invalid member'});
                                yield next;
                                return;
                            }
                            var experience = yield app.modelFactory().model_read(app.models['trv_experience'], this.params.experienceId);
                            if (!experience) {
                                this.body = app.wrapper.res.error({code: 51001, message: 'invalid experience'});
                                yield next;
                                return;
                            }
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
                            
                            //更新用户的收藏的见闻数量
                            member.stared -= 1;
                            yield member.save();
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

                            var member = yield app.modelFactory().model_one(app.models['trv_member'], {where: {code: this.params.memberId}, select: 'code name head_portrait following follower'});
                            if (!member) {
                                this.body = app.wrapper.res.error({code: 51002, message: 'invalid member'});
                                yield next;
                                return;
                            }
                            var memberInfo = member.toObject();

                            if( this.payload.member.member_id == this.params.memberId){
                                memberInfo.isFollowedByMe = false;
                            } else {
                                console.log(this.payload.member.member_id)
                                console.log(this.params.memberId)
                                var actionStatInfo = yield app.modelFactory().model_aggregate(app.models['trv_action'], [
                                    {
                                        $match: {
                                            subject_type: DIC.TRV04.MEMBER,
                                            subject_id: this.payload.member.member_id,
                                            action_type: {$in: [DIC.TRV05.FOLLOW, DIC.TRV05.UNFOLLOW]},
                                            object_type: DIC.TRV04.MEMBER,
                                            object_id: this.params.memberId
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: '$action_type',
                                            count: {$sum: 1}
                                        }
                                    },
                                    {
                                        $project: {
                                            action_type: '$_id',
                                            count: '$count'
                                        }
                                    }
                                ]);

                                console.log(actionStatInfo);

                                if (actionStatInfo.length == 0) {
                                    memberInfo.isFollowedByMe = false;
                                } else {
                                    memberInfo.isFollowedByMe = app._.where(actionStatInfo, {action_type: DIC.TRV05.FOLLOW}).length > app._.where(actionStatInfo, {action_type: DIC.TRV05.UNFOLLOW}).length;
                                }
                            }
                            this.body = app.wrapper.res.ret(memberInfo);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'memberFollow',
                verb: 'post',
                url: this.service_url_prefix + "/memberFollow/:followedMemberId",
                handler: function (app, options) {
                    return function *(next) {
                        try {

                            var followedMemberId = this.params.followedMemberId;
                            var member_id = this.payload.member.member_id;
                            console.log(member_id +' follow '+ followedMemberId)
                            if( followedMemberId == member_id){
                                this.body = app.wrapper.res.error({code: 52001, message: 'can not follow member self'});
                                yield next;
                                return;
                            }

                            var memberFollowed = yield app.modelFactory().model_one(app.models['trv_member'], {where: {code: followedMemberId}});
                            if (!memberFollowed) {
                                this.body = app.wrapper.res.error({code: 51002, message: 'invalid member'});
                                yield next;
                                return;
                            }

                            var memberFollower = yield app.modelFactory().model_one(app.models['trv_member'], {where: {code: member_id}});
                            if (!memberFollower) {
                                this.body = app.wrapper.res.error({code: 51002, message: 'invalid member'});
                                yield next;
                                return;
                            }

                            //更新外部会员库
                            var formData = {memberId: member_id,  followingMemberId: followedMemberId };
                            var ret = yield rp({method: 'POST', url: externalSystemConfig.member_repository_java.api_url + '/okertrip/api/follow/', form: formData, json: true});
                            if (ret.rntCode != 'OK') {
                                console.log(ret);
                                self.logger.error(ret);
                                this.body = app.wrapper.res.error({code: 59999 ,message: ret.rntMsg })
                                yield next;
                                return;
                            }


                            yield app.modelFactory().model_create(app.models['trv_action'], {
                                subject_type: DIC.TRV04.MEMBER,
                                subject_id: member_id,
                                action_type: DIC.TRV05.FOLLOW,
                                object_type: DIC.TRV04.MEMBER,
                                object_id: followedMemberId
                            });

                            memberFollower.following += 1; // 粉丝的关注人数+1
                            yield memberFollower.save();

                            memberFollowed.follower += 1; // 被关注人的粉丝+1
                            yield memberFollowed.save();

                            this.body = app.wrapper.res.ret({isFollowedByMe: true, following: memberFollowed.following, follower: memberFollowed.follower});
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
                method: 'memberUnFollow',
                verb: 'post',
                url: this.service_url_prefix + "/memberUnFollow/:unFollowedMemberId",
                handler: function (app, options) {
                    return function *(next) {
                        try {

                            var unFollowedMemberId = this.params.unFollowedMemberId;
                            var member_id = this.payload.member.member_id;
                            console.log(member_id +' unfollow '+ unFollowedMemberId)
                            if( unFollowedMemberId == member_id){
                                this.body = app.wrapper.res.error({code: 52001, message: 'can not unfollow member self'});
                                yield next;
                                return;
                            }

                            var memberFollowed = yield app.modelFactory().model_one(app.models['trv_member'], {where: {code: unFollowedMemberId}});
                            if (!memberFollowed) {
                                this.body = app.wrapper.res.error({code: 51002, message: 'invalid member'});
                                yield next;
                                return;
                            }

                            var memberFollower = yield app.modelFactory().model_one(app.models['trv_member'], {where: {code: member_id}});
                            if (!memberFollower) {
                                this.body = app.wrapper.res.error({code: 51002, message: 'invalid member'});
                                yield next;
                                return;
                            }

                            //更新外部会员库
                            var formData = {memberId: member_id,  followingMemberId: unFollowedMemberId };
                            var ret = yield rp({method: 'POST', url: externalSystemConfig.member_repository_java.api_url + '/okertrip/api/follow/delete', form: formData, json: true});
                            if (ret.rntCode != 'OK') {
                                console.log(ret);
                                self.logger.error(ret);
                                this.body = app.wrapper.res.error({code: 59999 ,message: ret.rntMsg })
                                yield next;
                                return;
                            }

                            yield app.modelFactory().model_create(app.models['trv_action'], {
                                subject_type: DIC.TRV04.MEMBER,
                                subject_id: member_id,
                                action_type: DIC.TRV05.UNFOLLOW,
                                object_type: DIC.TRV04.MEMBER,
                                object_id: unFollowedMemberId
                            });

                            memberFollower.following -= 1; // 原粉丝的关注人数-1
                            yield memberFollower.save();

                            memberFollowed.follower -= 1; //被关注人的粉丝数-1
                            yield memberFollowed.save();

                            this.body = app.wrapper.res.ret({isFollowedByMe: false, following: memberFollowed.following, follower: memberFollowed.follower});
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
                method: 'followings', //关注列表
                verb: 'post',
                url: this.service_url_prefix + "/followings/:memberId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var memberId = this.params.memberId;
                            var myId = null;
                            if (this.payload.member.member_id != 'anonymity') {
                                myId = this.payload.member.member_id;
                            }
                            var formData = {memberId: memberId, myId: myId,  pageSize: this.request.body.page.size, curPage: this.request.body.page.skip / this.request.body.page.size };
                            console.log(formData)
                            var ret = yield rp({method: 'POST', url: externalSystemConfig.member_repository_java.api_url + '/okertrip/api/follow/following', form: formData, json: true});
                            if (ret.rntCode == 'OK') {
                                var rows = ret.responseParams.pageContent;
                                console.log(rows)
                                this.body = app.wrapper.res.rows(rows);
                            } else {
                                console.log(ret);
                                self.logger.error(ret);
                                this.body = app.wrapper.res.error({code: 59999 ,message: ret.rntMsg })
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
                method: 'followers', //粉丝列表
                verb: 'post',
                url: this.service_url_prefix + "/followers/:memberId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var memberId = this.params.memberId;
                            var myId = null;
                            if (this.payload.member.member_id != 'anonymity') {
                                myId = this.payload.member.member_id;
                            }
                            var formData = {memberId: memberId, myId: myId, pageSize: this.request.body.page.size, curPage: this.request.body.page.skip / this.request.body.page.size };
                            var ret = yield rp({method: 'POST', url: externalSystemConfig.member_repository_java.api_url + '/okertrip/api/follow/follower', form: formData, json: true});
                            if (ret.rntCode == 'OK') {
                                var rows = ret.responseParams.pageContent;
                                console.log(rows)
                                this.body = app.wrapper.res.rows(rows);
                            } else {
                                console.log(ret);
                                self.logger.error(ret);
                                this.body = app.wrapper.res.error({code: 59999 ,message: ret.rntMsg })
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