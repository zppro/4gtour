/**
 * Created by zppro on 16-11-8.
 */
var co = require('co');
var rp = require('request-promise-native');
var DIC = require('../pre-defined/dictionary-constants.json');
var externalSystemConfig = require('../pre-defined/external-system-config.json');
module.exports = {
    transporters : {},
    init: function (ctx) {
        console.log('init member service... ');
        var self = this;
        this.file = __filename;
        this.filename = this.file.substr(this.file.lastIndexOf('/') + 1);
        this.log_name = 'bc_' + this.filename;
        this.ctx = ctx;
        this.logger = require('log4js').getLogger(this.log_name);
        if (!this.logger) {
            console.error('logger not loaded in ' + this.file);
        }
        else {
            this.logger.info(this.file + " loaded!");
        }

        console.log(this.filename + ' ready... ');

        this.cacheHeadPortrait = {};
        this.experienceSelect = 'category content imgs location member_id member_name likes stars retweets check_in_time time_description retweet_flag retweet_root';

        return this;
    },
    checkIn : function (member_id, member_name, member_head_portrait) {
        var self = this;
        return co(function *() {
            try {
                var member = yield self.ctx.modelFactory().model_one(self.ctx.models['trv_member'], {where:{code: member_id}})
                if (member) {
                    member.name = member_name;
                    if(member.head_portrait != member_head_portrait && self.cacheHeadPortrait[member_id]) {
                        self.cacheHeadPortrait[member_id] = member_head_portrait;
                    }
                    member.head_portrait = member_head_portrait;
                    member.check_status = 1;
                    yield member.save()
                } else {
                    yield self.ctx.modelFactory().model_create(self.ctx.models['trv_member'], {code: member_id, name: member_name, head_portrait: member_head_portrait, check_status: 1})
                }
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    checkOut: function (member_id) {
        var self = this;
        return co(function *() {
            try {
                var member = yield self.ctx.modelFactory().model_one(self.ctx.models['trv_member'], {where:{code: member_id}})
                if (member) {
                    member.check_status = 0;
                    yield member.save()
                }
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    reStatInfo: function (member_id) {
        var self = this;
        return co(function *() {
            try {
                var member = yield self.ctx.modelFactory().model_one(self.ctx.models['trv_member'], {where:{code: member_id}})
                if (member) {
                    console.log('reStatInfo:'+member_id+ ' name:'+ member.name);

                    /*** 发文数 ***/
                    var actionStatTweets = yield self.ctx.modelFactory().model_aggregate(self.ctx.models['trv_action'], [
                        {
                            $match: {
                                subject_type: DIC.TRV04.MEMBER,
                                subject_id: member_id,
                                action_type: {$in: [DIC.TRV05.TWEET, DIC.TRV05.RETWEET, DIC.TRV05.REMOVE]},
                                object_type: DIC.TRV04.EXPERIENCE
                            }
                        },
                        {
                            $group: {
                                _id: '$action_type',
                                count: {$sum: {$cond: { if: { $eq: [ "$action_type", DIC.TRV05.REMOVE ] }, then: -1, else: 1 }}}
                            }
                        },
                        {
                            $group: {
                                _id: 'tweeted',
                                count: {$sum: '$count'}
                            }
                        }
                    ]);
                    console.log(actionStatTweets)
                    if(actionStatTweets.length > 0) {
                        member.tweeted = actionStatTweets[0].count;
                    } else {
                        member.tweeted = 0;
                    }

                    /*** 收藏数 ***/
                    var actionStatStars = yield self.ctx.modelFactory().model_aggregate(self.ctx.models['trv_action'], [
                        {
                            $match: {
                                subject_type: DIC.TRV04.MEMBER,
                                subject_id: member_id,
                                action_type: {$in: [DIC.TRV05.STAR, DIC.TRV05.UNSTAR]},
                                object_type: DIC.TRV04.EXPERIENCE
                            }
                        },
                        {
                            $group: {
                                _id: '$action_type',
                                count: {$sum: {$cond: { if: { $eq: [ "$action_type", DIC.TRV05.UNSTAR ] }, then: -1, else: 1 }}}
                            }
                        },
                        {
                            $group: {
                                _id: 'stared',
                                count: {$sum: '$count'}
                            }
                        }
                    ]);
                    console.log(actionStatStars)
                    if(actionStatStars.length > 0) {
                        member.stared = actionStatStars[0].count;
                    } else {
                        member.stared = 0;
                    }

                    /*** 关注数 ***/
                    var actionStatFollowings = yield self.ctx.modelFactory().model_aggregate(self.ctx.models['trv_action'], [
                        {
                            $match: {
                                subject_type: DIC.TRV04.MEMBER,
                                subject_id: member_id,
                                action_type: {$in: [DIC.TRV05.FOLLOW, DIC.TRV05.UNFOLLOW]},
                                object_type: DIC.TRV04.MEMBER
                            }
                        },
                        {
                            $group: {
                                _id: '$action_type',
                                count: {$sum: {$cond: { if: { $eq: [ "$action_type", DIC.TRV05.UNFOLLOW ] }, then: -1, else: 1 }}}
                            }
                        },
                        {
                            $group: {
                                _id: 'following',
                                count: {$sum: '$count'}
                            }
                        }
                    ]);
                    console.log(actionStatFollowings)
                    if(actionStatFollowings.length > 0) {
                        member.following = actionStatFollowings[0].count;
                    } else {
                        member.following = 0;
                    }

                    /*** 粉丝数 ***/
                    var actionStatFollowers = yield self.ctx.modelFactory().model_aggregate(self.ctx.models['trv_action'], [
                        {
                            $match: {
                                subject_type: DIC.TRV04.MEMBER,
                                action_type: {$in: [DIC.TRV05.FOLLOW, DIC.TRV05.UNFOLLOW]},
                                object_type: DIC.TRV04.MEMBER,
                                object_id: member_id
                            }
                        },
                        {
                            $group: {
                                _id: '$action_type',
                                count: {$sum: {$cond: { if: { $eq: [ "$action_type", DIC.TRV05.UNFOLLOW ] }, then: -1, else: 1 }}}
                            }
                        },
                        {
                            $group: {
                                _id: 'follower',
                                count: {$sum: '$count'}
                            }
                        }
                    ]);
                    console.log(actionStatFollowers)
                    if(actionStatFollowers.length > 0) {
                        member.follower = actionStatFollowers[0].count;
                    } else {
                        member.follower = 0;
                    }

                    yield member.save();
                }
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    genFollowingTrendsGrouped: function (member_id, page) {
        var self = this;
        return co(function *() {
            try {
                var followingMemberIds = [];
                var ret = yield rp({method: 'POST', url: externalSystemConfig.member_repository_java.api_url + '/okertrip/api/follow/followingId', form: {memberId: member_id}, json: true});
                if (ret.rntCode == 'OK') {
                    followingMemberIds = ret.responseParams;
                } else {
                    console.log(ret);
                    self.logger.error(ret);
                    return self.ctx.wrapper.res.error({code: 59999 ,message: ret.rntMsg })
                }
                var followingMembers = yield self.ctx.modelFactory().model_query(self.ctx.models['trv_member'], {
                        where: {
                            code:{$in: followingMemberIds}
                        },
                        select: 'code name'
                    });
                console.log(followingMembers);
                var actions = yield self.ctx.modelFactory().model_query(self.ctx.models['trv_action'], {
                        where: {
                            subject_type: DIC.TRV04.MEMBER,
                            subject_id:{$in: followingMemberIds}
                        },
                        sort: {check_in_time: -1}
                    },
                    {limit: page.size, skip: page.skip});
                var trends = [];
                for(var i=0;i < actions.length; i++) {
                    var trend = {};
                    var subject = self.ctx._.find(followingMembers, function(o) { return o.code == actions[i].subject_id});
                    if(subject){
                        var action_type = actions[i].action_type;
                        var object_type = actions[i].object_type;
                        var object_id = actions[i].object_id;
                        trend.check_in_date = self.ctx.moment(actions[i].check_in_time).format('YYYYMMDD');
                        trend.check_in_hour_min = self.ctx.moment(actions[i].check_in_time).format('HH:mm');
                        trend.subject_id = subject.code;
                        trend.subject_name = subject.name;
                        trend.action_type = action_type;
                        trend.action_name = self.ctx.dictionary.pairs['TRV05'][action_type].name;
                        trend.object_id = object_id;
                        trend.object_type = object_type;
                        trend.is_experience_route = false;
                        trend.imgs = [];
                        if (object_type == DIC.TRV04.EXPERIENCE) {
                            var experience = yield self.ctx.modelFactory().model_read(self.ctx.models['trv_experience'], object_id);
                            if (action_type != DIC.TRV05.REMOVE) {
                                trend.imgs = experience.imgs;
                                trend.content = experience.content;
                                trend.is_experience_route = experience.category == 'A0003';
                            }
                            trend.object_name =  self.ctx.dictionary.pairs['TRV00'][experience.category].name;
                        } else {
                            var member = yield self.ctx.modelFactory().model_one(self.ctx.models['trv_member'], {where: {code: object_id}})
                            if (member) {
                                trend.object_name = member.name;
                            }

                        }
                        trends.push(trend);
                    }
                }

                var rows = [];
                var trendsGroupedByDate = self.ctx._.groupBy(trends, 'check_in_date');
                for(var key in trendsGroupedByDate){
                    rows.push({group_key: key, group_value: trendsGroupedByDate[key]});
                }
                rows.reverse();
                console.log(rows);
                return self.ctx.wrapper.res.rows(rows)
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    addHrefToName: function (content) {
        var self = this;
        return co(function *() {
            try {
                if(!content) content = '';
                var reg = new RegExp(/\/\/@([^\/]+):/gi);
                var matches=[],match;
                while(match=reg.exec(content)){
                    match.shift();
                    matches.push(match);
                }
                if(matches && matches.length > 0){
                    var names = self.ctx._.map(matches,function(o){return o[0]});
                    var members = yield self.ctx.modelFactory().model_query(self.ctx.models['trv_member'], {where:{name: {$in: names }},select: 'code name'});
                    for(var i= 0;i< matches.length;i++){
                        var member_name = matches[i][0];
                        var theOne = self.ctx._.find(members,function(o){ return o.name == member_name;});
                        if(theOne){
                            content = content.replace('//@' + member_name + ':', '//<a class="member-name-link" href="/#/ta/' + theOne.code + '/details">@' + member_name + '</a>:')
                        }
                    }
                }
                return content;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    getHeadPortrait: function (member_id) {
        var self = this;
        return co(function *() {
            try {
                if(!member_id) return '';
                var headPortrait = self.cacheHeadPortrait[member_id];
                if (!headPortrait) {
                    var member = yield self.ctx.modelFactory().model_one(self.ctx.models['trv_member'], {where:{code: member_id},select: 'head_portrait'});
                    headPortrait = member.head_portrait;
                    self.cacheHeadPortrait[member_id] = headPortrait;
                }
                return headPortrait;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    getExperienceTweeted: function (member_id, page) {
        var self = this;
        return co(function *() {
            try {
                var rawRows = yield self.ctx.modelFactory().model_query(self.ctx.models['trv_experience'], {
                        where: {status: 1, cancel_flag: 0, member_id: member_id},
                        select: self.experienceSelect,
                        sort: {check_in_time: -1}
                    },
                    {limit: page.size, skip: page.skip})
                    .populate('retweet_root');
                var rows = [];
                if (rawRows.length > 0) {
                    var row_ids = self.ctx._.map(rawRows,function(o){return o.id});

                    var theActions = yield self.ctx.modelFactory().model_query(self.ctx.models['trv_action'],
                        {
                            where:{subject_type:DIC.TRV04.MEMBER, object_type: DIC.TRV04.EXPERIENCE, object_id:{$in: row_ids }},
                            select:'object_id action_type subject_id'
                        });
                    for(var i=0;i<rawRows.length;i++){
                        var row = rawRows[i].toObject();
                        row.liked = self.ctx._.some(theActions, function (action) {
                            return action.subject_id == member_id && action.action_type == DIC.TRV05.LIKE && action.object_id == row.id
                        });
                        row.stared = self.ctx._.some(theActions, function (action) {
                            return action.subject_id == member_id && action.action_type == DIC.TRV05.STAR && action.object_id == row.id
                        });
                        row.member_head_portrait = yield self.getHeadPortrait(row.member_id);
                        if(self.ctx._.isObject(row.retweet_root)){
                            row.retweet_root.member_head_portrait = yield self.getHeadPortrait(row.retweet_root.member_id)
                        }
                        rows.push(row)
                    }
                }
                return rows;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
                throw e;
            }
        }).catch(self.ctx.coOnError);
    },
    getExperienceStared: function (member_id, page) {
        var self = this;
        return co(function *() {
            try {
                var actions = yield self.ctx.modelFactory().model_query(self.ctx.models['trv_action'], {
                        where: {
                            subject_type: DIC.TRV04.MEMBER,
                            subject_id: member_id,
                            action_type: DIC.TRV05.STAR,
                            object_type: DIC.TRV04.EXPERIENCE
                        },
                        select: 'object_id',
                        sort: {check_in_time: -1}
                    },
                    {limit: page.size, skip: page.skip});
                var rows = [];
                if (actions.length > 0) {
                    var object_ids = self.ctx._.map(actions,function(o){return o.object_id});
                    var rawRows = yield self.ctx.modelFactory().model_query(self.ctx.models['trv_experience'],
                        {
                            where:{status: 1, cancel_flag: 0, _id:{$in: object_ids }},
                            select:self.experienceSelect,
                            sort: {check_in_time: -1}
                        }).populate('retweet_root');
                    if (rawRows.length > 0) {
                        var row_ids = self.ctx._.map(rawRows,function(o){return o.id});

                        var theActions = yield self.ctx.modelFactory().model_query(self.ctx.models['trv_action'],
                            {
                                where:{subject_type:DIC.TRV04.MEMBER, action_type: DIC.TRV05.LIKE,object_type: DIC.TRV04.EXPERIENCE, object_id:{$in: row_ids }},
                                select:'object_id action_type subject_id'
                            });

                        for(var i=0;i<rawRows.length;i++){
                            var row = rawRows[i].toObject();
                            row.liked = self.ctx._.some(theActions, function (action) {
                                return action.subject_id == member_id && action.object_id == row.id
                            });
                            row.stared = true;
                            row.member_head_portrait = yield self.ctx.member_service.getHeadPortrait(row.member_id);
                            if(self.ctx._.isObject(row.retweet_root)){
                                row.retweet_root.member_head_portrait = yield self.getHeadPortrait(row.retweet_root.member_id)
                            }
                            rows.push(row)
                        }
                    }
                }
                return rows;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
                throw e;
            }
        }).catch(self.ctx.coOnError);
    }
};