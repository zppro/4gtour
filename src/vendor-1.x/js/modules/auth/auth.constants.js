/**
 * Created by zppro on 16-3-15.
 */
(function() {
    'use strict';

    angular
        .module('app.auth')
        .constant('AUTH_ACCESS_LEVELS', {
            'USER':         1,
            'KEY_USER':     2,
            'NURSING_MAN':  4,
            'ADMIN':        9,
            'SUPER_ADMIN':  999
        })
    ;

})();