/**=========================================================
 * Module: config.js
 * App routes and resources configuration
 =========================================================*/


(function() {
    'use strict';

    angular
        .module('app.routes')
        .config(routesConfig);

    routesConfig.$inject = ['$stateProvider', '$locationProvider', '$urlRouterProvider', 'RouteHelpersProvider', 'AUTH_ACCESS_LEVELS'];
    function routesConfig($stateProvider, $locationProvider, $urlRouterProvider, helper, AUTH_ACCESS_LEVELS) {

        // Set the following to true to enable the HTML5 Mode
        // You may have to set <base> tag in index and a routing configuration in your server
        $locationProvider.html5Mode(false);

        // defaults to dashboard
        //$urlRouterProvider.otherwise('/app/dashboard');
        $urlRouterProvider.otherwise(function ($injector) {
            var $state = $injector.get('$state');
            $state.go('app.dashboard');
            //or use:return $state.go('app.dashboard');
        });

        helper.setRemoteServiceRoot('services/');//所有后端服务的root地址

        // 
        // Application Routes
        // -----------------------------------   
        $stateProvider
            .state('app', {
                url: '/app',
                abstract: true,
                views: {
                    "main": {
                        controller: 'AppController',
                        templateUrl: helper.basepath('app.html')
                    },
                    "main-template": {
                        templateUrl: helper.basepath('app-template.html')
                    }
                },
                //templateUrl: helper.basepath('app.html'),
                resolve: helper.resolveFor('modernizr', 'icons', 'eonasdan-bootstrap-datetimepicker', 'locale_zh-cn','ui.select', 'ngDialog')
            })
            .state('app.dashboard', {
                url: '/dashboard',
                title: '数据面板',
                templateUrl: helper.basepath('dashboard-dispatcher.html'),
                access_level: AUTH_ACCESS_LEVELS.USER
            })
            .state('app.submenu', {
                url: '/submenu',
                title: 'Submenu',
                templateUrl: helper.basepath('submenu.html')
            })
            //
            // Single Page Routes
            // -----------------------------------
            .state('page', {
                url: '/page',
                views: {
                    "main": {
                        templateUrl: 'app/pages/page.html'
                    }
                },
                //templateUrl: 'app/pages/page.html',
                resolve: helper.resolveFor('modernizr', 'icons'),
                controller: ['$rootScope', function ($rootScope) {
                    $rootScope.app.layout.isBoxed = false;
                }]
            })
            .state('page.login', {
                url: '/login',
                templateUrl: 'app/pages/login.html'
            })
            .state('page.register', {
                url: '/register',
                templateUrl: 'app/pages/register.html'
            })
            .state('page.recover', {
                url: '/recover',
                templateUrl: 'app/pages/recover.html'
            })
            .state('page.lock', {
                url: '/lock',
                templateUrl: 'app/pages/lock.html'
            })
            .state('page.404', {
                url: '/404',
                templateUrl: 'app/pages/404.html'
            })
            //
            // CUSTOM RESOLVES
            //   Add your own resolves properties
            //   following this object extend
            //   method
            // -----------------------------------
            // .state('app.someroute', {
            //   url: '/some_url',
            //   templateUrl: 'path_to_template.html',
            //   controller: 'someController',
            //   resolve: angular.extend(
            //     helper.resolveFor(), {
            //     // YOUR RESOLVES GO HERE
            //     }
            //   )
            // })
        ;

    } // routesConfig

})();

