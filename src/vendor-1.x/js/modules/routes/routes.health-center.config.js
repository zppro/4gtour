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
            .state(MODEL_VARIABLES.STATE_PREFIXS.ROOT + MODEL_VARIABLES.SUBSYSTEM_NAMES.HEALTH_CENTER, {
                url: '/health-center',
                abstract: true,
                access_level: AUTH_ACCESS_LEVELS.USER,
                template: '<div class="module-header-wrapper" data-ui-view="module-header"></div><div class="module-content-wrapper" data-ui-view="module-content"></div>',
                resolve: {
                    vmh: helper.buildVMHelper()
                    // , deps: helper.resolveFor2('subsystem.health-center')
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.HEALTH_CENTER + 'dashboard', {
                url: '/dashboard',
                title: '数据面板',
                access_level: AUTH_ACCESS_LEVELS.USER,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.HEALTH_CENTER),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.HEALTH_CENTER + 'dashboard.html'),
                        controller: 'DashboardHealthCenterController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM(MODEL_VARIABLES.VM_PREFIXS.HEALTH_CENTER + 'dashboard')
                            , deps: helper.resolveFor2(MODEL_VARIABLES.RES_PREFIXS.HEALTH_CENTER + 'dashboard.js')
                        }
                    }
                }
                , resolve: helper.resolveFor('echarts.common','echarts-ng','classyloader')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.HEALTH_CENTER + 'user-manage', {
                url: '/user-manage',
                title: '用户管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.HEALTH_CENTER),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id: MODEL_VARIABLES.BIZ_FUNC_PREFIXS.HEALTH_CENTER + 'USER-MANAGE'//业务系统使用
                }
                , resolve: helper.resolveFor(MODEL_VARIABLES.RES_PREFIXS.SHARED + 'user-manage.js')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.HEALTH_CENTER + 'user-manage.list', {
                url: '/list/:action/:roles',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.SHARED + 'user-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: MODEL_VARIABLES.CONTROLLER_NAMES.USER_MANAGE_GRID,
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.HEALTH_CENTER +'user-manage.list', {
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.HEALTH_CENTER + 'user-manage.details', {
                url: '/details/:action/:_id/:roles',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.SHARED + 'user-manage-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: MODEL_VARIABLES.CONTROLLER_NAMES.USER_MANAGE_DETAILS,
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.HEALTH_CENTER + 'user-manage.details', {
                        modelName: 'pub-user',
                        model: {type:'A0002'},
                        blockUI: true,
                        toList: ['roles']
                    })
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.HEALTH_CENTER + 'wxa-config', {
                url: '/wxa-config',
                title: '微信小程序*',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.HEALTH_CENTER),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id: MODEL_VARIABLES.BIZ_FUNC_PREFIXS.HEALTH_CENTER + 'WXA-CONFIG'//业务系统使用
                }
                , resolve: helper.resolveFor(MODEL_VARIABLES.RES_PREFIXS.SHARED +'wxa-config.js')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.HEALTH_CENTER + 'wxa-config.list', {
                url: '/list/:action',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.SHARED + 'wxa-config-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: MODEL_VARIABLES.CONTROLLER_NAMES.WXACONFIG_GRID,
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.HEALTH_CENTER + 'wxa-config.list', {
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.HEALTH_CENTER + 'wxa-config.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.SHARED + 'wxa-config-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: MODEL_VARIABLES.CONTROLLER_NAMES.WXACONFIG_DETAILS,
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.HEALTH_CENTER + 'wxa-config.details', {
                        modelName: 'pub-wxaConfig',
                        model: {templates: [], splash_imgs: []},
                        blockUI: true
                    }), deps: helper.resolveFor2('qiniu','qiniu-ng')
                }
            })
        ;

    } // routesConfig

})();

