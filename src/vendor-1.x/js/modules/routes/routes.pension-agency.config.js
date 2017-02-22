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

        // 养老机构
        $stateProvider
            .state(MODEL_VARIABLES.STATE_PREFIXS.ROOT + MODEL_VARIABLES.SUBSYSTEM_NAMES.PENSION_AGENCY, {
                url: MODEL_VARIABLES.URLS.PENSION_AGENCY,
                abstract: true,
                access_level: AUTH_ACCESS_LEVELS.USER,
                template: '<div class="module-header-wrapper" data-ui-view="module-header"></div><div class="module-content-wrapper" data-ui-view="module-content"></div>',
                resolve: {
                    vmh: helper.buildVMHelper()
                    , deps: helper.resolveFor2(MODEL_VARIABLES.RES_PREFIXS.PENSION_AGENCY)
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'dashboard', {
                url: '/dashboard',
                title: '数据面板',
                access_level: AUTH_ACCESS_LEVELS.USER,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.PENSION_AGENCY),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.PENSION_AGENCY + 'dashboard.html'),
                        controller: 'DashboardPensionAgencyController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM(MODEL_VARIABLES.VM_PREFIXS.PENSION_AGENCY + 'dashboard')
                            , deps: helper.resolveFor2(MODEL_VARIABLES.RES_PREFIXS.PENSION_AGENCY + 'dashboard.js')
                        }
                    }
                }
                , resolve: helper.resolveFor('echarts.common','echarts-ng','classyloader')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'enter', {
                url: '/enter',
                title: '入院管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.PENSION_AGENCY),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.pension-agency.ENTER'//业务系统使用
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'enter.list', {
                url: '/list/:action',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.PENSION_AGENCY + 'enter-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'EnterManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.PENSION_AGENCY + 'enter.list', {
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'enter.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.PENSION_AGENCY + 'enter-details.html'),
                controller: 'EnterManageDetailsController',
                access_level: AUTH_ACCESS_LEVELS.USER,
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.PENSION_AGENCY + 'enter.details', {
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'room', {
                url: '/room',
                title: '房间管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.PENSION_AGENCY),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data: {
                    func_id:'menu.pension-agency.ROOM',//业务系统使用
                    selectFilterObject: {"districts": {"status": 1}}
                }
                , resolve: helper.resolveFor(MODEL_VARIABLES.RES_PREFIXS.PENSION_AGENCY + 'room.js')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'room.list', {
                url: '/list/:action/:districtId',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.PENSION_AGENCY + 'room-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'RoomGridController',
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.PENSION_AGENCY + 'room.list', {
                        modelName: 'psn-room',
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'room.details', {
                url: '/details/:action/:_id/:districtId',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.PENSION_AGENCY + 'room-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'RoomDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.PENSION_AGENCY + 'room.details', {
                        modelName: 'psn-room',
                        model: {
                            capacity: 1
                        },
                        blockUI: true,
                        toList: ['districtId']
                    })
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'room.details-batch-add', {
                url: '/details-batch-add/:districtId',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.PENSION_AGENCY + 'room-details-batch-add.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'RoomDetailsBatchAddController',
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.PENSION_AGENCY + 'room.details-batch-add', {
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'room.details-batch-edit', {
                url: '/details-batch-edit/:districtId',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.PENSION_AGENCY + 'room-details-batch-edit.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'RoomDetailsBatchEditController',
                params:{selectedIds:null},
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.PENSION_AGENCY + 'room.details-batch-edit', {
                        modelName: 'psn-room',
                        model: {
                            capacity: 1
                        },
                        blockUI: true,
                        toList: ['districtId']
                    })
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'district', {
                url: '/district',
                title: '片区管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.PENSION_AGENCY),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.pension-agency.DISTRICT'//业务系统使用
                }
                , resolve: helper.resolveFor(MODEL_VARIABLES.RES_PREFIXS.PENSION_AGENCY + 'district.js')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'district.list', {
                url: '/list/:action',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.PENSION_AGENCY + 'district-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'DistrictGridController',
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.PENSION_AGENCY + 'district.list', {
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'district.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.PENSION_AGENCY + 'district-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'DistrictDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.PENSION_AGENCY + 'district.details', {
                        modelName: 'psn-district'
                        , blockUI: true
                    })
                    //, deps: helper.resolveFor2('ui.select')
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'charge-standard', {
                url: '/charge-standard',
                title: '收费标准',
                access_level: AUTH_ACCESS_LEVELS.USER,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.PENSION_AGENCY),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.SHARED +'charge-standard.html'),
                        controller: 'ChargeStandardController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM(MODEL_VARIABLES.VM_PREFIXS.PENSION_AGENCY + 'charge-standard'),
                            deps: helper.resolveFor2('angularjs-slider')
                        }
                    }
                },
                data:{
                    func_id:'menu.pension-agency.CHARGE-STANDARD'//业务系统使用
                }
                , resolve: helper.resolveFor(MODEL_VARIABLES.RES_PREFIXS.SHARED + 'charge-standard.js')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'charge-item-customized', {
                url: '/charge-item-customized',
                title: '特色服务',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.PENSION_AGENCY),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data: {
                    func_id:'menu.pension-agency.CHARGE-ITEM-CUSTOMIZED'//业务系统使用
                }
                , resolve: helper.resolveFor(MODEL_VARIABLES.RES_PREFIXS.PENSION_AGENCY + 'charge-item-customized.js')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'charge-item-customized.list', {
                url: '/list/:action',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.PENSION_AGENCY + 'charge-item-customized-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'ChargeItemCustomizedGridController',
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.PENSION_AGENCY + 'charge-item-customized.list', {
                        modelName: 'psn-chargeItemCustomized',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        columns: [
                            {
                                label: '服务名称',
                                name: 'name',
                                type: 'string',
                                width: 200,
                                sortable: true
                            },
                            {
                                label: '服务老人数量',
                                name: 'served_quantity',
                                type: 'number',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '备注',
                                name: 'remark',
                                type: 'string',
                                width: 180
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'charge-item-customized.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.PENSION_AGENCY +'charge-item-customized-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'ChargeItemCustomizedDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.PENSION_AGENCY + 'charge-item-customized.details', {
                        modelName: 'psn-chargeItemCustomized',
                        model: {
                            catagory: MODEL_VARIABLES.PRE_DEFINED.SERVER_GEN,
                            served_quantity: 0
                        }
                        , blockUI: true
                    })
                    //, deps: helper.resolveFor2('ui.select')
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'user-manage', {
                url: '/user-manage',
                title: '用户管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.PENSION_AGENCY),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.pension-agency.USER-MANAGE'//业务系统使用
                }
                , resolve: helper.resolveFor(MODEL_VARIABLES.RES_PREFIXS.SHARED + 'user-manage.js')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'user-manage.list', {
                url: '/list/:action/:roles',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.SHARED + 'user-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: MODEL_VARIABLES.CONTROLLER_NAMES.USER_MANAGE_GRID,
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.PENSION_AGENCY + 'user-manage.list', {
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'user-manage.details', {
                url: '/details/:action/:_id/:roles',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.SHARED + 'user-manage-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: MODEL_VARIABLES.CONTROLLER_NAMES.USER_MANAGE_DETAILS,
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.PENSION_AGENCY + 'user-manage.details', {
                        modelName: 'pub-user',
                        model: {type:'A0002'},
                        blockUI: true,
                        toList: ['roles']
                    })
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'wxa-config', {
                url: '/wxa-config',
                title: '微信小程序*',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.PENSION_AGENCY),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.pension-agency.WXA-CONFIG'//业务系统使用
                }
                , resolve: helper.resolveFor(MODEL_VARIABLES.RES_PREFIXS.SHARED + 'wxa-config.js')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'wxa-config.list', {
                url: '/list/:action',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.SHARED + 'wxa-config-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: MODEL_VARIABLES.CONTROLLER_NAMES.WXACONFIG_GRID,
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.PENSION_AGENCY + 'wxa-config.list', {
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.PENSION_AGENCY + 'wxa-config.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.SHARED + 'wxa-config-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: MODEL_VARIABLES.CONTROLLER_NAMES.WXACONFIG_DETAILS,
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.PENSION_AGENCY + 'wxa-config.details', {
                        modelName: 'pub-wxaConfig',
                        model: {templates: []},
                        blockUI: true
                    }), deps: helper.resolveFor2('qiniu','qiniu-ng')
                }
            })
        ;

    } // routesConfig

})();

