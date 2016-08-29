/**
 * Created by zppro on 16-3-14.
 */
(function() {
    'use strict';

    angular
        .module('app.interceptor')
        .config(interceptorConfig);

    interceptorConfig.$inject = ['$httpProvider'];
    function interceptorConfig($httpProvider) {
        $httpProvider.interceptors.push([
            '$injector',
            function ($injector) {
                return $injector.get('globalInterceptor');
            }
        ]);
    }
})();