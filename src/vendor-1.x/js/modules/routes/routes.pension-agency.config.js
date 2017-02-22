/**=========================================================
 * Module: config.js
 * App routes and resources configuration
 =========================================================*/


(function() {
    'use strict';

    angular
        .module('app.routes')
        .config(routesHealthCenterConfig);

    routesHealthCenterConfig.$inject = ['$stateProvider', 'RouteHelpersProvider', 'AUTH_ACCESS_LEVELS','MODEL_VARIABLES', 'SETTING_KEYS'];
    function routesHealthCenterConfig($stateProvider, helper, AUTH_ACCESS_LEVELS,MODEL_VARIABLES, SETTING_KEYS) {

        var subsystemPrefix = SETTING_KEYS.SREF_PENSION_AGENCY
        // 个人健康管理中心
        $stateProvider
            .state(subsystemPrefix, {
                url: '/pension-agency',
                abstract: true,
                access_level: AUTH_ACCESS_LEVELS.USER,
                template: '<div class="module-header-wrapper" data-ui-view="module-header"></div><div class="module-content-wrapper" data-ui-view="module-content"></div>',
                resolve: {
                    vmh: helper.buildVMHelper()
                    , deps: helper.resolveFor2('subsystem.pension-agency')
                }
            })
            .state(subsystemPrefix + '.dashboard', {
                url: '/dashboard',
                title: '数据面板',
                access_level: AUTH_ACCESS_LEVELS.USER,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/pension-agency/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        templateUrl: helper.basepath('pension-agency/dashboard.html'),
                        controller: 'DashboardPensionAgencyController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM('app.pension-agency.dashboard')
                            , deps: helper.resolveFor2('subsystem.pension-agency.dashboard.js')
                        }
                    }
                }
                , resolve: helper.resolveFor('echarts.common','echarts-ng','classyloader')
            })
            .state(subsystemPrefix + '.enter', {
                url: '/enter',
                title: '入院管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/pension-agency/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.pension-agency.ENTER'//业务系统使用
                }
            })
            .state(subsystemPrefix + '.enter.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('pension-agency/enter-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'EnterManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.pension-agency.enter.list', {
                        modelName: 'psn-enter',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        columns: [
                            {
                                label: '入院登记号',
                                name: 'code',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '老人',
                                name: 'elderly_summary',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '入院日期',
                                name: 'enter_on',
                                type: 'date',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '预付款',
                                name: 'deposit',
                                type: 'number',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '当前步骤',
                                name: 'current_register_step',
                                type: 'string',
                                width: 80,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/D3000/object')
                            },
                            {
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 40
                            }
                        ]
                    })
                }
            })
            .state(subsystemPrefix + '.enter.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('pension-agency/enter-details.html'),
                controller: 'EnterManageDetailsController',
                access_level: AUTH_ACCESS_LEVELS.USER,
                resolve: {
                    entityVM: helper.buildEntityVM('app.pension-agency.enter.details', {
                        modelName: 'psn-enter',
                        model: {
                            code: MODEL_VARIABLES.PRE_DEFINED.SERVER_GEN,
                            enter_on: new Date(),
                            period_value_in_advance: 1
                        },
                        blockUI: true
                    })
                }
            })
            .state(subsystemPrefix + '.room', {
                url: '/room',
                title: '房间管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/pension-agency/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data: {
                    func_id:'menu.pension-agency.ROOM',//业务系统使用
                    selectFilterObject: {"districts": {"status": 1}}
                }
            })
            .state(subsystemPrefix + '.room.list', {
                url: '/list/:action/:districtId',
                templateUrl: helper.basepath('pension-agency/room-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'RoomGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.pension-agency.room.list', {
                        modelName: 'pfta-room',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        columns: [
                            {
                                label: '片区',
                                name: 'districtId',
                                type: 'string',
                                width: 200,
                                //sortable: true,
                                formatter: 'model-related:psn-district'
                            },
                            {
                                label: '房间名称',
                                name: 'name',
                                type: 'string',
                                width: 200,
                                sortable: true
                            },
                            {
                                label: '所在层',
                                name: 'floor',
                                type: 'number',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '床位数量',
                                name: 'capacity',
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
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 60
                            }
                        ],
                        switches: {leftTree: true},
                        toDetails: ['districtId']
                    })
                }
            })
            .state(subsystemPrefix + '.room.details', {
                url: '/details/:action/:_id/:districtId',
                templateUrl: helper.basepath('pension-agency/room-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'RoomDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.pension-agency.room.details', {
                        modelName: 'psn-room',
                        model: {
                            capacity: 1
                        },
                        blockUI: true,
                        toList: ['districtId']
                    })
                }
            })
            .state(subsystemPrefix + '.room.details-batch-add', {
                url: '/details-batch-add/:districtId',
                templateUrl: helper.basepath('pension-agency/room-details-batch-add.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'RoomDetailsBatchAddController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.pension-agency.room.details-batch-add', {
                        modelName: 'psn-room',
                        model: {
                            capacity: 1
                        },
                        blockUI: true,
                        toList: ['districtId']
                    }),
                    deps: helper.resolveFor2('angularjs-slider')
                }
            })
            .state(subsystemPrefix + '.room.details-batch-edit', {
                url: '/details-batch-edit/:districtId',
                templateUrl: helper.basepath('pension-agency/room-details-batch-edit.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'RoomDetailsBatchEditController',
                params:{selectedIds:null},
                resolve: {
                    entityVM: helper.buildEntityVM('app.pension-agency.room.details-batch-edit', {
                        modelName: 'psn-room',
                        model: {
                            capacity: 1
                        },
                        blockUI: true,
                        toList: ['districtId']
                    })
                }
            })
            .state(subsystemPrefix + '.district', {
                url: '/district',
                title: '片区管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/pension-agency/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.pension-agency.DISTRICT'//业务系统使用
                }
                , resolve: helper.resolveFor('subsystem.pension-agency.district.js')
            })
            .state(subsystemPrefix + '.district.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('pension-agency/district-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,

                controller: 'DistrictGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.pension-agency.district.list', {
                        modelName: 'psn-district',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        columns: [
                            {
                                label: '片区名称',
                                name: 'name',
                                type: 'string',
                                width: 320,
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
            .state(subsystemPrefix + '.district.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('pension-agency/district-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'DistrictDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.pension-agency.district.details', {
                        modelName: 'psn-district'
                        , blockUI: true
                    })
                    //, deps: helper.resolveFor2('ui.select')
                }
            })
            .state(subsystemPrefix + '.user-manage', {
                url: '/user-manage',
                title: '用户管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/pension-agency/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.pension-agency.USER-MANAGE'//业务系统使用
                }
                , resolve: helper.resolveFor('subsystem.shared.user-manage.js')
            })
            .state(subsystemPrefix + '.user-manage.list', {
                url: '/list/:action/:roles',
                templateUrl: helper.basepath('shared/user-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'Shared_UserManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.pension-agency.user-manage.list', {
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
            .state(subsystemPrefix + '.user-manage.details', {
                url: '/details/:action/:_id/:roles',
                templateUrl: helper.basepath('shared/user-manage-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'Shared_UserManageDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.pension-agency.user-manage.details', {
                        modelName: 'pub-user',
                        model: {type:'A0002'},
                        blockUI: true,
                        toList: ['roles']
                    })
                }
            })
            .state(subsystemPrefix + '.wxa-config', {
                url: '/wxa-config',
                title: '微信小程序*',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/pension-agency/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.pension-agency.WXA-CONFIG'//业务系统使用
                }
                , resolve: helper.resolveFor('subsystem.shared.wxa-config.js')
            })
            .state(subsystemPrefix + '.wxa-config.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('shared/wxa-config-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'Shared_wxaConfigGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.pension-agency.wxa-config.list', {
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
            .state(subsystemPrefix + '.wxa-config.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('shared/wxa-config-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'Shared_wxaConfigDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.pension-agency.wxa-config.details', {
                        modelName: 'pub-wxaConfig',
                        model: {templates: []},
                        blockUI: true
                    }), deps: helper.resolveFor2('qiniu','qiniu-ng')
                }
            })
        ;

    } // routesConfig

})();

