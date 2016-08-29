(function() {
    'use strict';

    angular
        .module('app.core', [
            'ngRoute',
            'ngAnimate',
            'ngStorage',
            'ngCookies',
            'pascalprecht.translate',
            'ui.bootstrap',
            'ui.router',
            'oc.lazyLoad',
            'blockUI',
            'cfp.loadingBar',
            'ngSanitize',
            'ngResource',
            'ui.utils',
            'ui.validate'
        ]);
})();