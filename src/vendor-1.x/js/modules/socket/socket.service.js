/**
 * Created by zppro on 17-3-31.
 */
(function() {
    'use strict';

    angular.module('app.socket')
        .service('SocketManager', SocketManager);

    SocketManager.$inject = ['$location'];

    function SocketManager($location) {
        return {
            socketChannels: {},
            registerChannel: function (channelName) {
                if (!this.socketChannels[channelName]) {
                    console.log('registerChannel: ', channelName);
                    var port = $location.port(), channel;
                    var socketUrl = ($location.host() + port === 80 ? '' : ':' + port) + channelName;
                    if (socketUrl.toLowerCase().startsWith('https')) {
                        channel = io(socketUrl, {secure: true})
                    } else {
                        channel = io(socketUrl)
                    }
                    this.socketChannels[channelName] = channel;
                }

                return this.getChannel(channelName);
            },
            getChannel: function (channelName) {
                return this.socketChannels[channelName];
            }
        };
    }

})();