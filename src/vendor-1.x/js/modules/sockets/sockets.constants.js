(function() {
    'use strict';
    angular
        .module('app.sockets')
        .constant('SOCKET_SERVER_EVENTS', {
            PSN: {
                BED_MONITOR: {
                    $SOCKET_URL: '/psn$bed_monitor',
                    LEAVE: 'psn$bed_monitor$leave',
                    LEAVE_TIME: 'psn$bed_monitor$leave_time',
                    COME: 'psn$bed_monitor$come'
                }
            }
        })
    ;
})();
