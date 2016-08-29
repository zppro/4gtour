/**=========================================================
 * Module: config.js
 * App routes and resources configuration
 =========================================================*/


(function() {
    'use strict';

    angular
        .module('app.routes')
        .config(routesOrganizationPFTAConfig);

    routesOrganizationPFTAConfig.$inject = ['$stateProvider', 'RouteHelpersProvider', 'AUTH_ACCESS_LEVELS','MODEL_VARIABLES'];
    function routesOrganizationPFTAConfig($stateProvider, helper, AUTH_ACCESS_LEVELS,MODEL_VARIABLES) {


        // 机构养老云开始
        $stateProvider
            .state('app.organization-pfta', {
                url: '/organization-pfta',
                abstract: true,
                access_level: AUTH_ACCESS_LEVELS.USER,
                template: '<div class="module-header-wrapper" data-ui-view="module-header"></div><div class="module-content-wrapper" data-ui-view="module-content"></div>',
                resolve: {
                    vmh: helper.buildVMHelper()
                    , deps: helper.resolveFor2('subsystem.organization-pfta')
                }
            })
            .state('app.organization-pfta.dashboard', {
                url: '/dashboard',
                title: '数据面板',
                access_level: AUTH_ACCESS_LEVELS.USER,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        templateUrl: helper.basepath('organization-pfta/dashboard.html'),
                        controller: 'DashboardControllerOfOrganizationOfPFTAController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM('app.organization-pfta.dashboard')
                        }
                    }
                }
                , resolve: helper.resolveFor('echarts.common','echarts-ng','classyloader')
            })
            .state('app.organization-pfta.enter-manage', {
                url: '/enter-manage',
                title: '入院管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-pfta.ENTER-MANAGE'//业务系统使用
                }
            })
            .state('app.organization-pfta.enter-manage.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('organization-pfta/enter-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'EnterManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-pfta.enter-manage.list', {
                        modelName: 'pfta-enter',
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
            .state('app.organization-pfta.enter-manage.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('organization-pfta/enter-manage-details.html'),
                controller: 'EnterManageDetailsController',
                access_level: AUTH_ACCESS_LEVELS.USER,
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-pfta.enter-manage.details', {
                        modelName: 'pfta-enter',
                        model: {
                            code: MODEL_VARIABLES.PRE_DEFINED.SERVER_GEN,
                            enter_on: new Date(),
                            period_value_in_advance: 1
                        },
                        blockUI: true
                    })
                }
            })
            .state('app.organization-pfta.in-manage', {
                url: '/in-manage',
                title: '在院管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-pfta.IN-MANAGE'//业务系统使用
                }
            })
            .state('app.organization-pfta.in-manage.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('organization-pfta/in-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'InManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-pfta.in-manage.list', {
                        modelName: 'pub-elderly',
                        searchForm: {"status": 1,"live_in_flag":true},
                        serverPaging: true,
                        columns: [
                            {
                                label: '老人',
                                name: 'name',
                                type: 'string',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '入院登记号',
                                name: 'enter_code',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '性别',
                                name: 'sex',
                                type: 'string',
                                width: 40,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/D1006/object')
                            },
                            {
                                label: '年龄',
                                name: 'birthday',
                                type: 'date',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '饮食套餐',
                                name: 'board_summary',
                                type: 'string',
                                width: 80
                            },
                            {
                                label: '房间床位',
                                name: 'room_summary',
                                type: 'string',
                                width: 120
                            },
                            {
                                label: '护理信息',
                                name: 'nursing_summary',
                                type: 'string',
                                width: 80
                            },
                            {
                                label: '状态',
                                name: 'begin_exit_flow',
                                type: 'string',
                                width: 80,
                                formatter: function () {
                                    return {"true": "正在出院", "false": "在院", "undefined": "在院"}
                                }
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
            .state('app.organization-pfta.in-manage.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('organization-pfta/in-manage-details.html'),
                controller: 'InManageDetailsController',
                access_level: AUTH_ACCESS_LEVELS.USER,
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-pfta.in-manage.details', {
                        modelName: 'pub-elderly',
                        blockUI: true
                    })
                }
            })
            .state('app.organization-pfta.exit-manage', {
                url: '/exit-manage',
                title: '出院管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-pfta.EXIT-MANAGE'//业务系统使用
                }
            })
            .state('app.organization-pfta.exit-manage.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('organization-pfta/exit-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'ExitManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-pfta.exit-manage.list', {
                        modelName: 'pfta-exit',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        columns: [
                            {
                                label: '老人',
                                name: 'elderly_name',
                                type: 'string',
                                width: 80,
                                sortable: true
                            },
                            {
                                label: '入院登记号',
                                name: 'code',
                                type: 'string',
                                width: 100,
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
                                label: '申请出院日期',
                                name: 'application_date',
                                type: 'date',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '当前步骤',
                                name: 'current_step',
                                type: 'string',
                                width: 80,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/D3004/object')
                            },
                            {
                                label: '出院日期',
                                name: 'exit_on',
                                type: 'date',
                                width: 60,
                                sortable: true
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
            .state('app.organization-pfta.exit-manage.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('organization-pfta/exit-manage-details.html'),
                controller: 'ExitManageDetailsController',
                access_level: AUTH_ACCESS_LEVELS.USER,
                params:{autoSetTab:null},
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-pfta.exit-manage.details', {
                        modelName: 'pfta-exit',
                        model: {},
                        blockUI: true
                    })
                }
            })
            .state('app.organization-pfta.reception-manage', {
                url: '/reception-manage',
                title: '接待管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-pfta.RECEPTION-MANAGE'//业务系统使用
                }
            })
            .state('app.organization-pfta.reception-manage.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('organization-pfta/reception-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'ReceptionManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-pfta.reception-manage.list', {
                        modelName: 'pfta-reception',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        columns: [
                            {
                                label: '接待登记号',
                                name: 'code',
                                type: 'string',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '探望老人',
                                name: 'elderly_name',
                                type: 'string',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '探望日期',
                                name: 'begin_on',
                                type: 'date',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '探望时段',
                                name: 'end_on',
                                type: 'date',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '访客',
                                name: 'visit_summary',
                                type: 'string',
                                width: 120,
                                sortable: true
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
            .state('app.organization-pfta.reception-manage.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('organization-pfta/reception-manage-details.html'),
                controller: 'ReceptionManageDetailsController',
                access_level: AUTH_ACCESS_LEVELS.USER,
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-pfta.reception-manage.details', {
                        modelName: 'pfta-reception',
                        model: {
                            code: MODEL_VARIABLES.PRE_DEFINED.SERVER_GEN,
                            begin_on: new Date()
                        },
                        blockUI: true
                    })
                    , deps: helper.resolveFor2('angucomplete-alt')
                }
            })
            .state('app.organization-pfta.leave-manage', {
                url: '/leave-manage',
                title: '外出管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-pfta.LEAVE-MANAGE'//业务系统使用
                }
            })
            .state('app.organization-pfta.leave-manage.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('organization-pfta/leave-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'LeaveManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-pfta.leave-manage.list', {
                        modelName: 'pfta-leave',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        columns: [
                            {
                                label: '外出登记号',
                                name: 'code',
                                type: 'string',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '外出老人',
                                name: 'elderly_name',
                                type: 'string',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '外出时间',
                                name: 'begin_on',
                                type: 'date',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '归还时间',
                                name: 'end_on',
                                type: 'date',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '陪同人',
                                name: 'accompany_summary',
                                type: 'string',
                                width: 120,
                                sortable: true
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
            .state('app.organization-pfta.leave-manage.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('organization-pfta/leave-manage-details.html'),
                controller: 'LeaveManageDetailsController',
                access_level: AUTH_ACCESS_LEVELS.USER,
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-pfta.leave-manage.details', {
                        modelName: 'pfta-leave',
                        model: {
                            code: MODEL_VARIABLES.PRE_DEFINED.SERVER_GEN,
                            begin_on: new Date()
                        },
                        blockUI: true
                    })
                    , deps: helper.resolveFor2('angucomplete-alt')
                }
            })
            .state('app.organization-pfta.financial-enter-payment', {
                url: '/financial-enter-payment',
                title: '老人入院缴费',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-pfta.ENTER-PAYMENT'//业务系统使用
                }
            })
            .state('app.organization-pfta.financial-enter-payment.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('organization-pfta/financial-enter-payment-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'FinancialEnterPaymentGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-pfta.financial-enter-payment.list', {
                        modelName: 'pfta-enter',
                        searchForm: {"status": 1,"current_register_step": {"$in": ['A0003', 'A0005', 'A0007']}},
                        transTo: 'app.organization-pfta.enter-manage.details',
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
            .state('app.organization-pfta.financial-recharge', {
                url: '/financial-recharge',
                title: '老人账户充值',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-pfta.RECHARGE'//业务系统使用
                }
            })
            .state('app.organization-pfta.financial-recharge.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('organization-pfta/financial-recharge-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'FinancialRechargeGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-pfta.financial-recharge.list', {
                        modelName: 'pub-recharge',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        columns: [
                            {
                                label: '充值日期',
                                name: 'check_in_time',
                                type: 'date',
                                width: 80,
                                sortable: true
                            },
                            {
                                label: '充值对象',
                                name: 'elderly_name',
                                type: 'string',
                                width: 80,
                                sortable: true
                            },
                            {
                                label: '充值金额',
                                name: 'amount',
                                type: 'number',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '充值方式',
                                name: 'type',
                                type: 'string',
                                width: 60,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/D3005/object')
                            },
                            {
                                label: '备注',
                                name: 'remark',
                                type: 'string',
                                width: 180
                            },
                            {
                                label: '记账凭证号',
                                name: 'voucher_no',
                                type: 'string',
                                width: 60
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
            .state('app.organization-pfta.financial-recharge.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('organization-pfta/financial-recharge-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'FinancialRechargeDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-pfta.financial-recharge.details', {
                        modelName: 'pub-recharge'
                        , blockUI: true
                    })
                    , deps: helper.resolveFor2('angucomplete-alt')
                }
            })
            .state('app.organization-pfta.financial-arrearage-manage', {
                url: '/financial-arrearage-manage',
                title: '老人欠费管理',
                templateUrl: helper.basepath('organization-pfta/financial-arrearage-manage.html'),
                access_level: AUTH_ACCESS_LEVELS.USER
            })
            .state('app.organization-pfta.financial-exit-settlement', {
                url: '/financial-exit-settlement',
                title: '老人出院结算',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-pfta.EXIT-SETTLEMENT'//业务系统使用
                }
            })
            .state('app.organization-pfta.financial-exit-settlement.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('organization-pfta/financial-exit-settlement-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'FinancialExitSettlementGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-pfta.financial-exit-settlement.list', {
                        modelName: 'pfta-exit',
                        searchForm: {"status": 1,"current_step": {"$in": ['A0005', 'A0007','A0009']}},
                        transTo: 'app.organization-pfta.exit-manage.details',
                        serverPaging: true,
                        columns: [
                            {
                                label: '老人',
                                name: 'elderly_name',
                                type: 'string',
                                width: 80,
                                sortable: true
                            },
                            {
                                label: '入院登记号',
                                name: 'code',
                                type: 'string',
                                width: 100,
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
                                label: '申请出院日期',
                                name: 'application_date',
                                type: 'date',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '当前步骤',
                                name: 'current_step',
                                type: 'string',
                                width: 80,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/D3004/object')
                            },
                            {
                                label: '出院日期',
                                name: 'exit_on',
                                type: 'date',
                                width: 60,
                                sortable: true
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
            .state('app.organization-pfta.financial-red', {
                url: '/financial-red',
                title: '机构冲红明细',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-pfta.RED'//业务系统使用
                }
            })
            .state('app.organization-pfta.financial-red.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('organization-pfta/financial-red-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'FinancialRedGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-pfta.financial-red.list', {
                        modelName: 'pub-red',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        columns: [
                            {
                                label: '冲红日期',
                                name: 'check_in_time',
                                type: 'date',
                                width: 80,
                                sortable: true
                            },
                            {
                                label: '记账凭证号',
                                name: 'voucher_no',
                                type: 'string',
                                width: 60
                            },
                            {
                                label: '冲红凭证号',
                                name: 'voucher_no_to_red',
                                type: 'string',
                                width: 60
                            },
                            {
                                label: '冲红金额',
                                name: 'amount',
                                type: 'string',
                                width: 80,
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
            .state('app.organization-pfta.financial-red.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('organization-pfta/financial-red-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'FinancialRedDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-pfta.financial-red.details', {
                        modelName: 'pub-red'
                        , blockUI: true
                    })
                    , deps: helper.resolveFor2('angucomplete-alt')
                }
            })
            .state('app.organization-pfta.financial-org-receipts-and-disbursements-details', {
                url: '/financial-org-receipts-and-disbursements-details',
                title: '机构收支明细',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-pfta.ORG-RECEIPTS-AND-DISBURSEMENTS-DETAILS'//业务系统使用
                }
            })
            .state('app.organization-pfta.financial-org-receipts-and-disbursements-details.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('organization-pfta/financial-org-receipts-and-disbursements-details-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'FinancialORGReceiptsAndDisbursementsDetailsGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-pfta.financial-org-receipts-and-disbursements-details.list', {
                        modelName: 'pub-tenantJournalAccount',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        columns: [
                            {
                                label: '记账日期',
                                name: 'check_in_time',
                                type: 'date',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '记账凭证号',
                                name: 'voucher_no',
                                type: 'string',
                                width: 60
                            },
                            {
                                label: '科目',
                                name: 'revenue_and_expenditure_type',
                                type: 'string',
                                width: 60,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/D3001/object')
                            },
                            {
                                label: '摘要',
                                name: 'digest',
                                type: 'string',
                                width: 120
                            },
                            {
                                label: '记账金额',
                                name: 'amount',
                                type: 'number',
                                width: 40,
                                sortable: true
                            },
                            {
                                label: '结转',
                                name: 'carry_over_flag',
                                type: 'bool',
                                width: 30
                            },
                            {
                                label: '冲红',
                                name: 'red_flag',
                                type: 'bool',
                                width: 30
                            }
                        ]
                    })
                }
            })
            .state('app.organization-pfta.material-exit-item-return', {
                url: '/material-exit-item-return',
                title: '出院物品归还',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-pfta.EXIT-ITEM-RETURN'//业务系统使用
                }
            })
            .state('app.organization-pfta.material-exit-item-return.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('organization-pfta/material-exit-item-return-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'MaterialExitItemReturnGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-pfta.material-exit-item-return.list', {
                        modelName: 'pfta-exit',
                        searchForm: {"status": 1,"current_step": {"$in": ['A0003', 'A0005', 'A0007','A0009']}},
                        transTo: 'app.organization-pfta.exit-manage.details',
                        serverPaging: true,
                        columns: [
                            {
                                label: '老人',
                                name: 'elderly_name',
                                type: 'string',
                                width: 80,
                                sortable: true
                            },
                            {
                                label: '入院登记号',
                                name: 'code',
                                type: 'string',
                                width: 100,
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
                                label: '申请出院日期',
                                name: 'application_date',
                                type: 'date',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '当前步骤',
                                name: 'current_step',
                                type: 'string',
                                width: 80,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/D3004/object')
                            },
                            {
                                label: '出院日期',
                                name: 'exit_on',
                                type: 'date',
                                width: 60,
                                sortable: true
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
            .state('app.organization-pfta.material-inventory-manage', {
                url: '/material-inventory-manage',
                title: '库存管理',
                templateUrl: helper.basepath('organization-pfta/material-inventory-manage.html'),
                access_level: AUTH_ACCESS_LEVELS.USER
            })
            .state('app.organization-pfta.material-donation-manage', {
                url: '/material-donation-manage',
                title: '捐赠管理',
                templateUrl: helper.basepath('organization-pfta/material-donation-manage.html'),
                access_level: AUTH_ACCESS_LEVELS.USER
            })
            .state('app.organization-pfta.knowledge-base-manage', {
                url: '/knowledge-base-manage',
                title: '知识库管理',
                templateUrl: helper.basepath('organization-pfta/knowledge-base-manage.html'),
                access_level: AUTH_ACCESS_LEVELS.USER
            })
            .state('app.organization-pfta.user-manage', {
                url: '/user-manage',
                title: '用户管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-pfta.USER-MANAGE'//业务系统使用
                }
            })
            .state('app.organization-pfta.user-manage.list', {
                url: '/list/:action/:roles',
                templateUrl: helper.basepath('organization-pfta/user-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'UserManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-pfta.user-manage.list', {
                        modelName: 'pub-user',
                        searchForm: {"status": 1,"type": 'A0002'},//user.type 养老机构用户
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
            .state('app.organization-pfta.user-manage.details', {
                url: '/details/:action/:_id/:roles',
                templateUrl: helper.basepath('organization-pfta/user-manage-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'UserManageDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-pfta.user-manage.details', {
                        modelName: 'pub-user',
                        model: {type:'A0002'},
                        blockUI: true,
                        toList: ['roles']
                    })
                }
            })
            .state('app.organization-pfta.system-department-manage', {
                url: '/system-department-manage',
                title: '部门管理',
                templateUrl: helper.basepath('organization-pfta/system-department-manage.html'),
                access_level: AUTH_ACCESS_LEVELS.USER
            })
            .state('app.organization-pfta.room-manage', {
                url: '/room-manage',
                title: '房间管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data: {
                    func_id:'menu.organization-pfta.ROOM-MANAGE',//业务系统使用
                    selectFilterObject: {"districts": {"status": 1}}
                }
            })
            .state('app.organization-pfta.room-manage.list', {
                url: '/list/:action/:districtId',
                templateUrl: helper.basepath('organization-pfta/room-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'RoomManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-pfta.room-manage.list', {
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
                                formatter: 'model-related:pfta-district'
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
            .state('app.organization-pfta.room-manage.details', {
                url: '/details/:action/:_id/:districtId',
                templateUrl: helper.basepath('organization-pfta/room-manage-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'RoomManageDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-pfta.room-manage.details', {
                        modelName: 'pfta-room',
                        model: {
                            capacity: 1
                        },
                        blockUI: true,
                        toList: ['districtId']
                    })
                }
            })
            .state('app.organization-pfta.room-manage.details-batch-add', {
                url: '/details-batch-add/:districtId',
                templateUrl: helper.basepath('organization-pfta/room-manage-details-batch-add.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'RoomManageDetailsBatchAddController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-pfta.room-manage.details-batch-add', {
                        modelName: 'pfta-room',
                        model: {
                            capacity: 1
                        },
                        blockUI: true,
                        toList: ['districtId']
                    }),
                    deps: helper.resolveFor2('angularjs-slider')
                }
            })
            .state('app.organization-pfta.room-manage.details-batch-edit', {
                url: '/details-batch-edit/:districtId',
                templateUrl: helper.basepath('organization-pfta/room-manage-details-batch-edit.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'RoomManageDetailsBatchEditController',
                params:{selectedIds:null},
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-pfta.room-manage.details-batch-edit', {
                        modelName: 'pfta-room',
                        model: {
                            capacity: 1
                        },
                        blockUI: true,
                        toList: ['districtId']
                    })
                }
            })
            .state('app.organization-pfta.district-manage', {
                url: '/district-manage',
                title: '片区管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-pfta.DISTRICT-MANAGE'//业务系统使用
                }
            })
            .state('app.organization-pfta.district-manage.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('organization-pfta/district-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,

                controller: 'DistrictManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-pfta.district-manage.list', {
                        modelName: 'pfta-district',
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
            .state('app.organization-pfta.district-manage.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('organization-pfta/district-manage-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'DistrictManageDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-pfta.district-manage.details', {
                        modelName: 'pfta-district'
                        , blockUI: true
                    })
                    //, deps: helper.resolveFor2('ui.select')
                }
            })
            .state('app.organization-pfta.charge-standard', {
                url: '/charge-standard',
                access_level: AUTH_ACCESS_LEVELS.USER,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderController'
                    },
                    "module-content": {
                        templateUrl: helper.basepath('organization-pfta/charge-standard.html'),
                        controller: 'ChargeStandardController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM('app.organization-pfta.charge-standard'),
                            deps: helper.resolveFor2('angularjs-slider')
                        }
                    }
                },
                data:{
                    func_id:'menu.organization-pfta.CHARGE-STANDARD'//业务系统使用
                }
            })
            .state('app.organization-pfta.charge-item-customized', {
                url: '/charge-item-customized',
                title: '特色服务',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-pfta/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data: {
                    func_id:'menu.organization-pfta.CHARGE-ITEM-CUSTOMIZED'//业务系统使用
                }
            })
            .state('app.organization-pfta.charge-item-customized.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('organization-pfta/charge-item-customized-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'ChargeItemCustomizedGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-pfta.charge-item-customized.list', {
                        modelName: 'pub-tenantChargeItemCustomized',
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
            .state('app.organization-pfta.charge-item-customized.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('organization-pfta/charge-item-customized-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'ChargeItemCustomizedDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-pfta.charge-item-customized.details', {
                        modelName: 'pub-tenantChargeItemCustomized',
                        model: {
                            catagory: MODEL_VARIABLES.PRE_DEFINED.SERVER_GEN,
                            served_quantity: 0
                        }
                        , blockUI: true
                    })
                    //, deps: helper.resolveFor2('ui.select')
                }
            })
            .state('app.organization-pfta.system-log', {
                url: '/system-log',
                title: '系统日志',
                templateUrl: helper.basepath('organization-pfta/system-log.html'),
                access_level: AUTH_ACCESS_LEVELS.ADMIN
            })
        ;

    } // routesConfig

})();

