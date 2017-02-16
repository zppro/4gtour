/**=========================================================
 * Module: config.js
 * App routes and resources configuration
 =========================================================*/


(function() {
    'use strict';

    angular
        .module('app.routes')
        .config(routesHealthCenterConfig);

    routesHealthCenterConfig.$inject = ['$stateProvider', 'RouteHelpersProvider', 'AUTH_ACCESS_LEVELS','MODEL_VARIABLES'];
    function routesHealthCenterConfig($stateProvider, helper, AUTH_ACCESS_LEVELS,MODEL_VARIABLES) {


        // 个人健康管理中心
        $stateProvider
            .state('app.health-center', {
                url: '/health-center',
                abstract: true,
                access_level: AUTH_ACCESS_LEVELS.USER,
                template: '<div class="module-header-wrapper" data-ui-view="module-header"></div><div class="module-content-wrapper" data-ui-view="module-content"></div>',
                resolve: {
                    vmh: helper.buildVMHelper()
                    // , deps: helper.resolveFor2('subsystem.merchant-webstore')
                }
            })
            .state('app.health-center.dashboard', {
                url: '/dashboard',
                title: '数据面板',
                access_level: AUTH_ACCESS_LEVELS.USER,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/health-center/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        templateUrl: helper.basepath('health-center/dashboard.html'),
                        controller: 'DashboardControllerOfHealthCenterController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM('app.health-center.dashboard')
                            , deps: helper.resolveFor2('subsystem.health-center.dashboard.js')
                        }
                    }
                }
                , resolve: helper.resolveFor('echarts.common','echarts-ng','classyloader')
            })
            .state('app.health-center.user-manage', {
                url: '/user-manage',
                title: '用户管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/merchant-webstore/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.health-center.USER-MANAGE'//业务系统使用
                }
                , resolve: helper.resolveFor('subsystem.shared.user-manage.js')
            })
            .state('app.health-center.user-manage.list', {
                url: '/list/:action/:roles',
                templateUrl: helper.basepath('shared/user-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'Shared_UserManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.health-center.user-manage.list', {
                        modelName: 'pub-user',
                        searchForm: {"status": 1,"type": 'A0002'},//user.type Web商城用户
                        serverPaging: true,
                        columns: [
                            {
                                label: '用户编码',
                                name: 'code',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '用户名称',
                                name: 'name',
                                type: 'string',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '手机号码',
                                name: 'phone',
                                type: 'string',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '停用',
                                name: 'stop_flag',
                                type: 'bool',
                                width: 40
                            },
                            {
                                label: '角色',
                                name: 'roles',
                                type: 'string',
                                width: 120,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/D1001/object')
                            },
                            {
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 60
                            }
                        ],
                        switches: {leftTree: true},
                        toDetails: ['roles']
                    })
                }
            })
            .state('app.health-center.user-manage.details', {
                url: '/details/:action/:_id/:roles',
                templateUrl: helper.basepath('shared/user-manage-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'Shared_UserManageDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.health-center.user-manage.details', {
                        modelName: 'pub-user',
                        model: {type:'A0002'},
                        blockUI: true,
                        toList: ['roles']
                    })
                }
            })
            .state('app.health-center.wxa-config', {
                url: '/wx-app-config',
                title: '微信小程序*',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/merchant-webstore/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.health-center.WXA-CONFIG'//业务系统使用
                }
                , resolve: helper.resolveFor('subsystem.shared.wxa-config.js')
            })
            .state('app.health-center.wxa-config.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('shared/wxa-config-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'Shared_wxaConfigGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.health-center.wxa-config.list', {
                        modelName: 'pub-wxaConfig',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        blockUI: true,
                        columns: [
                            {
                                label: 'appid',
                                name: 'app_id',
                                sortable: false,
                                width:  120
                            },
                            {
                                label: 'app名称',
                                name: 'app_name',
                                type: 'string',
                                width: 240,
                                sortable: true
                            },
                            {
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 60
                            }
                        ]
                    })
                }
            })
            .state('app.health-center.wxa-config.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('shared/wxa-config-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'Shared_wxaConfigDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.health-center.wxa-config.details', {
                        modelName: 'pub-wxaConfig',
                        model: {templates: []},
                        blockUI: true
                    }), deps: helper.resolveFor2('qiniu','qiniu-ng')
                }
            })
        ;

    } // routesConfig

})();

