/**
 * Created by zppro on 16-12-19.
 */
var co = require('co');
var rp = require('request-promise-native');
var io = require('socket.io');
var externalSystemConfig = require('../pre-defined/external-system-config.json');
var socketServerEvents = require('../pre-defined/socket-server-events.json');
var socketClientEvents = require('../pre-defined/socket-client-events.json');
module.exports = {
    init: function (ctx, server) {
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
    addMemberNamespace: function(server) {
        this.socketClients = {};
        this.memberClients = {};
        this.socketIO = io.listen(server);
        this.nspOfMember = this.socketIO.of('/member');
        this.nspOfMember.on('connection', this.onMemberConnection.bind(this));
    },
    onMemberConnection: function (socket) {
        var self = this;
        console.log('connection: ' + socket.id);
        self.socketClients[socket.id] = socket;
        socket.on('disconnect', function() {
            console.log('disconnect: ' + socket.id);
            delete self.socketClients[socket.id];
        });
        socket.on(socketClientEvents.MEMBER.LOGIN, function(data) {
            return co(function *() {
                try {
                    console.log(socketClientEvents.MEMBER.LOGIN + + ':' + socket.id + '  => data  ' + data);
                    var member_id = data;
                    self.memberClients[member_id] = socket;
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
                        var followingSocket = self.memberClients[followingIds[i]];
                        //加入所有在线的关注人
                        followingSocket && socket.join(followingSocket.id);
                    }
                    for (var i=0;i< followerIds.length; i++) {
                        var followerSocket = self.memberClients[followerIds[i]];
                        //所有在线粉丝加入当前会员所在频道
                        followerSocket && followerSocket.join(socket.id);
                    }

                    socket.emit(socketServerEvents.MEMBER.YOUR_FOLLOWING_MEMBER_LOGIN_SUCCESS, member_id);
                    // socket.on(socketServerEvents.MEMBER.YOUR_FOLLOWING_LOGIN, function(followingMemberId) {
                    //     // 某个关注人登录上线
                    //     var followingSocket = self.memberClients[followingMemberId];
                    //     followingSocket && socket.join(followingSocket.id);
                    // });
                }
                catch (e) {
                    console.log(e);
                    self.logger.error(e.message);
                }
            }).catch(self.ctx.coOnError);
        });


    }
};