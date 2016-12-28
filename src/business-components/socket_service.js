/**
 * Created by zppro on 16-12-19.
 */
var co = require('co');
var rp = require('request-promise-native');
var io = require('socket.io');
var externalSystemConfig = require('../pre-defined/external-system-config.json');
var socketServerEvents = require('../pre-defined/socket-server-events.json');
var socketClientEvents = require('../pre-defined/socket-client-events.json');
var DIC = require('../pre-defined/dictionary-constants.json');
module.exports = {
    init: function (ctx) {
        console.log('init socket service... ');
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
 
        return this;
    },
    mountServer: function (server) {
        this.ioSocket = io.listen(server);
    },
    addMemberNamespace: function() {
        this.socketClientsOfMember = {};
        this.memberClientsOfMember = {};
        this.nspOfMember = this.ioSocket.of('/member');
        this.nspOfMember.on('connection', this.onMemberConnection.bind(this));
    },
    onMemberConnection: function (socket) {
        var self = this;
        console.log('nsp member connection: ' + socket.id);
        self.socketClientsOfMember[socket.id] = socket;
        socket.on('disconnect', function() {
            console.log('nsp member disconnect: ' + socket.id);
            delete self.socketClientsOfMember[socket.id];
        });
        socket.on(socketClientEvents.MEMBER.LOGIN, function(data) {
            return co(function *() {
                try {
                    console.log(socketClientEvents.MEMBER.LOGIN + + ':' + socket.id + '  => data  ' + data);
                    var member_id = data;
                    self.memberClientsOfMember[member_id] = socket;
                    var followingIds = [];
                    var followerIds = [];
                    var ret = yield rp({method: 'POST', url: externalSystemConfig.member_repository_java.api_url + '/okertrip/api/follow/followId', form: {memberId: member_id}, json: true});
                    if (ret.rntCode == 'OK') {
                        followingIds = ret.responseParams.followingId;
                        followerIds = ret.responseParams.followedId;
                    } else {
                        console.log(ret);
                        self.logger.error(ret);
                        return self.ctx.wrapper.res.error({code: 59999 ,message: ret.rntMsg })
                    }
                    console.log('followingIds...');
                    console.log(followingIds);

                    console.log('followerIds...')
                    console.log(followerIds);
                    for (var i=0;i< followingIds.length; i++) {
                        var followingSocket = self.memberClientsOfMember[followingIds[i]];
                        //加入所有在线的关注人
                        followingSocket && socket.join(followingSocket.id);
                    }
                    for (var i=0;i< followerIds.length; i++) {
                        var followerSocket = self.memberClientsOfMember[followerIds[i]];
                        //所有在线粉丝加入当前会员所在频道
                        followerSocket && followerSocket.join(socket.id);
                    }

                    socket.emit(socketServerEvents.MEMBER.YOUR_FOLLOWING_MEMBER_LOGIN_SUCCESS, member_id);
                    // socket.on(socketServerEvents.MEMBER.YOUR_FOLLOWING_LOGIN, function(followingMemberId) {
                    //     // 某个关注人登录上线
                    //     var followingSocket = self.memberClientsOfMember[followingMemberId];
                    //     followingSocket && socket.join(followingSocket.id);
                    // });
                }
                catch (e) {
                    console.log(e);
                    self.logger.error(e.message);
                }
            }).catch(self.ctx.coOnError);
        });
    },
    addGroupNamespace: function() {
        this.socketClientsOfGroup = {};
        this.nspOfGroup = this.ioSocket.of('/group');
        this.nspOfGroup.on('connection', this.onGroupConnection.bind(this));
    },
    sendGroupChannelEvent: function (eventName, eventData) {
        console.log('sendGroupChannelEvent eventName: ' + eventName);
        console.log('reason: ' + eventData.reason);
        this.nspOfGroup.emit(eventName, eventData);
    },
    sendGroupEvent: function (groupId, eventName, eventData) {
        console.log('sendGroupEvent with room id: ' + 'group_' + groupId);
        console.log('eventName: ' + eventName);
        console.log('reason: ' + eventData.reason);
        this.nspOfGroup.to('group_' + groupId).emit(eventName, eventData);
    },
    onGroupConnection: function (socket) {
        var self = this;
        console.log('nsp group connection: ' + socket.id);
        self.socketClientsOfGroup[socket.id] = socket;
        socket.on('disconnect', function() {
            console.log('nsp group disconnect: ' + socket.id);
            delete self.socketClientsOfGroup[socket.id];
        });
        socket.on(socketClientEvents.GROUP.SHAKE_HAND, function(data) {
            return co(function *() {
                try {
                    console.log(socketClientEvents.GROUP.SHAKE_HAND + ':' + socket.id + '  => data  ' +  JSON.stringify(data));
                    var member_id = data;
                    var memberParticipatedGroups = yield self.ctx.modelFactory().model_query(self.ctx.models['trv_group'], {
                            where: {
                                status: 1,
                                cancel_flag: 0,
                                group_status: {$in: [DIC.TRV07.SIGN_UP, DIC.TRV07.WAITING_TRAVEL, DIC.TRV07.TRAVELLING]},
                                participants: {$elemMatch: {"participant_id": member_id}}
                            },
                            select: 'name'
                        });
                    for (var i=0;i<memberParticipatedGroups.length;i++) {
                        console.log('SHAKE_HAND room_name:' + memberParticipatedGroups[i].id)
                        socket.join('group_' + memberParticipatedGroups[i].id);
                    }
                    console.log('finished shake hand')
                }
                catch (e) {
                    console.log(e);
                    self.logger.error(e.message);
                }
            }).catch(self.ctx.coOnError);
        });
        socket.on(socketClientEvents.GROUP.PUBLISHING, function(data) {
            return co(function *() {
                try {
                    console.log(socketClientEvents.GROUP.PUBLISHING + ':' + socket.id + '  => data  ' +  JSON.stringify(data));
                    var group_id = data;
                    socket.join('group_' + group_id);
                    console.log('join room_name:' + 'group_' + group_id)

                    var group = yield self.ctx.modelFactory().model_read(self.ctx.models['trv_group'], group_id);
                    var deadline = group.deadline || group.assembling_time;
                    self.ctx.group_service.addJobGroupDeadlineForRegistration(group.id, group.name, deadline);
                    // if (!group.deadline || self.ctx.moment(group.deadline).unix() - self.ctx.moment(group.assembling_time).unix() >= 0) {
                    //     // 为定义报名截止时间或者报名截止时间定义晚于集合时间
                    //     self.ctx.group_service.addJobGroupDeadlineForRegistration(group.id, group.name, deadline);
                    // } else {
                    //     self.ctx.group_service.addJobGroupDeadlineForRegistration(group.id, group.name, deadline);
                    //     self.ctx.group_service.addJobGroupChangeToTravelling(group.id, group.name, group.assembling_time);
                    // }
                }
                catch (e) {
                    console.log(e);
                    self.logger.error(e.message);
                }
            }).catch(self.ctx.coOnError);
        });
        socket.on(socketClientEvents.GROUP.PARTICIPATE, function(data) {
            return co(function *() {
                try {
                    console.log(socketClientEvents.GROUP.PARTICIPATE + ':' + socket.id + '  => data  ' +  JSON.stringify(data));
                    var group_id = data;
                    socket.join('group_' + group_id);
                    var group = yield self.ctx.modelFactory().model_read(self.ctx.models['trv_group'], group_id);
                    socket.to('group_' + group_id).emit(socketServerEvents.GROUP.BROADCAST_PARTICIPATE, {reason: 'PARTICIPATE', group: group });
                    console.log('send group participate event by socket to room other member')
                }
                catch (e) {
                    console.log(e);
                    self.logger.error(e.message);
                }
            }).catch(self.ctx.coOnError);
        });
        socket.on(socketClientEvents.GROUP.EXIT, function(data) {
            return co(function *() {
                try {
                    console.log(socketClientEvents.GROUP.EXIT + ':' + socket.id + '  => data  ' +  JSON.stringify(data));
                    var group_id = data;
                    socket.leave('group_' + group_id);
                    var group = yield self.ctx.modelFactory().model_read(self.ctx.models['trv_group'], group_id);
                    socket.to('group_' + group_id).emit(socketServerEvents.GROUP.BROADCAST_EXIT,  {reason: 'EXIT', group: group });
                }
                catch (e) {
                    console.log(e);
                    self.logger.error(e.message);
                }
            }).catch(self.ctx.coOnError);
        });
        socket.on(socketClientEvents.GROUP.CHECK_IN, function(data) {
            return co(function *() {
                try {
                    console.log(socketClientEvents.GROUP.LOCATE + ':' + socket.id + '  => data  ' + JSON.stringify(data));
                    var group_id = data.group_id;
                    socket.to('group_' + group_id).emit(socketServerEvents.GROUP.BROADCAST_CHECK_IN,  {reason: 'CHECK_IN', checking_member: data.checking_member });
                }
                catch (e) {
                    console.log(e);
                    self.logger.error(e.message);
                }
            }).catch(self.ctx.coOnError);
        });
        socket.on(socketClientEvents.GROUP.LOCATE, function(data) {
            return co(function *() {
                try {
                    console.log(socketClientEvents.GROUP.LOCATE + ':' + socket.id + '  => data  ' + JSON.stringify(data));
                    var group_id = data.group_id;
                    socket.to('group_' + group_id).emit(socketServerEvents.GROUP.BROADCAST_LOCATION, data);
                }
                catch (e) {
                    console.log(e);
                    self.logger.error(e.message);
                }
            }).catch(self.ctx.coOnError);
        });
    }
};