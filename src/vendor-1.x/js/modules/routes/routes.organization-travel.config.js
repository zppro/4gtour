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


        // 商户开始
        $stateProvider
            .state('app.organization-travel', {
                url: '/organization-travel',
                abstract: true,
                access_level: AUTH_ACCESS_LEVELS.USER,
                template: '<div class="module-header-wrapper" data-ui-view="module-header"></div><div class="module-content-wrapper" data-ui-view="module-content"></div>',
                resolve: {
                    vmh: helper.buildVMHelper()
                    , deps: helper.resolveFor2('subsystem.organization-travel')
                }
            })
            .state('app.organization-travel.dashboard', {
                url: '/dashboard',
                title: '数据面板',
                access_level: AUTH_ACCESS_LEVELS.USER,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-travel/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        templateUrl: helper.basepath('organization-travel/dashboard.html'),
                        controller: 'DashboardControllerOfOrganizationOfTravelController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM('app.organization-travel.dashboard')
                            , deps: helper.resolveFor2('subsystem.organization-travel.dashboard.js')
                        }
                    }
                }
                , resolve: helper.resolveFor('echarts.common','echarts-ng','classyloader')
            })
            .state('app.organization-travel.scenery-spot', {
                url: '/scenery-spot',
                title: '景点',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-travel/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-travel.SCENERY-SPOT'//业务系统使用
                }
                , resolve: helper.resolveFor('subsystem.organization-travel.scenery-spot.js')
            })
            .state('app.organization-travel.scenery-spot.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('organization-travel/scenery-spot-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'ScenerySpotGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-travel.scenery-spot.list', {
                        modelName: 'trv-scenerySpot',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        blockUI: true,
                        columns: [
                            {
                                label: '预览',
                                name: 'preview',
                                sortable: false,
                                width:  30
                            },
                            {
                                label: '编码',
                                name: 'code',
                                type: 'string',
                                width: 80,
                                sortable: true
                            },
                            {
                                label: '名称',
                                name: 'name',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '显示名称',
                                name: 'show_name',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '所在地区',
                                name: 'area',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '景点级别',
                                name: 'level',
                                type: 'string',
                                width: 60,
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
            .state('app.organization-travel.scenery-spot.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('organization-travel/scenery-spot-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'ScenerySpotDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-travel.scenery-spot.details', {
                        modelName: 'trv-scenerySpot',
                        model: {
                            code: MODEL_VARIABLES.PRE_DEFINED.SERVER_GEN,
                            level: 'AAAAA'
                        },
                        blockUI: true
                    })
                }
            })
            .state('app.organization-travel.scenic-spot', {
                url: '/scenic-spot',
                title: '景区',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-travel/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-travel.SCENIC-SPOT'//业务系统使用
                }
                , resolve: helper.resolveFor('subsystem.organization-travel.scenic-spot.js')
            })
            .state('app.organization-travel.scenic-spot.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('organization-travel/scenic-spot-PFT-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'PFT_ScenicSpotGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-travel.scenic-spot.list', {
                        modelName: 'idc-scenicSpot_PFT',
                        searchForm: {"status": 1},
                        transTo: {
                            "ticket": 'app.organization-travel.ticket.list',
                        },
                        serverPaging: true,
                        blockUI: true,
                        columns: [
                            {
                                label: '预览',
                                name: 'preview',
                                sortable: false,
                                width:  30
                            },
                            {
                                label: '显示名称',
                                name: 'show_name',
                                type: 'string',
                                width: 240,
                                sortable: true
                            },
                            {
                                label: '添加时间',
                                name: 'UUaddtime',
                                type: 'date',
                                width: 60,
                                sortable: true
                            },
                            // {
                            //     label: '所在地区',
                            //     name: 'UUarea',
                            //     type: 'string',
                            //     width: 120,
                            //     sortable: true
                            // },
                            {
                                label: '产品类型',
                                name: 'UUp_type',
                                type: 'string',
                                width: 60,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/IDC00/object')
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
            .state('app.organization-travel.scenic-spot.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('organization-travel/scenic-spot-PFT-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'PFT_ScenicSpotDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-travel.scenic-spot.details', {
                        modelName: 'idc-scenicSpot_PFT',
                        blockUI: true
                    })
                }
            })
            .state('app.organization-travel.ticket', {
                url: '/ticket',
                title: '票务',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-travel/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-travel.TICKET'//业务系统使用
                }
                , resolve: helper.resolveFor('subsystem.organization-travel.ticket.js')
            })
            .state('app.organization-travel.ticket.list', {
                url: '/list/:action/:scenicSpotId',
                templateUrl: helper.basepath('organization-travel/ticket-PFT-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'PFT_TicketGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-travel.ticket.list', {
                        modelName: 'idc-ticket_PFT',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        blockUI: true,
                        columns: [
                            {
                                label: '名称',
                                name: 'show_name',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '取票信息',
                                name: 'UUgetaddr',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '状态',
                                name: 'UUstatus',
                                type: 'string',
                                width: 40,
                                formatter: 'dictionary-local:{"0":"在售"}'
                            },
                            {
                                label: '游客信息',
                                name: 'UUtourist_info',
                                type: 'string',
                                width: 80,
                                formatter: 'dictionary-local:{"0":"不需要填写","1":"只填一位游客信息","2":"填每位游客信息"}'
                            },
                            {
                                label: '门市价',
                                name: 'UUtprice',
                                type: 'currency',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '销售价',
                                name: 'sale_price',
                                type: 'currency',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '支付方式',
                                name: 'UUpay',
                                type: 'string',
                                width: 60,
                                formatter: 'dictionary-local:{"0":"现场支付","1":"在线支付"}'
                            },
                            {
                                label: '限(最少-最多)',
                                name: '$UUbuy_limit',
                                type: 'string',
                                width: 70
                            },
                            {
                                label: '需退审',
                                name: 'UUrefund_audit',
                                type: 'bool',
                                width: 50
                            },
                            {
                                label: '产品说明',
                                name: 'UUnotes',
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
                        ],
                        switches: {leftTree: true}
                    })
                }
            })
            .state('app.organization-travel.ticket.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('organization-travel/ticket-PFT-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'PFT_TicketDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-travel.ticket.details', {
                        modelName: 'idc-ticket_PFT',
                        blockUI: true
                    })
                }
            })
            .state('app.organization-travel.order', {
                url: '/order',
                title: '订单',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-travel/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-travel.ORDER'//业务系统使用
                }
                , resolve: helper.resolveFor('subsystem.organization-travel.order.js')
            })
            .state('app.organization-travel.order.list', {
                url: '/list/:action/:scenicSpotId',
                templateUrl: helper.basepath('organization-travel/order-PFT-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'PFT_OrderGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-travel.order.list', {
                        modelName: 'idc-order_PFT',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        blockUI: true,
                        columns: [
                            {
                                label: '本地订单号',
                                name: 'code',
                                type: 'string',
                                width: 80,
                                sortable: true
                            },
                            {
                                label: '产品名称',
                                name: 'p_name',
                                type: 'string',
                                width: 80
                            },
                            {
                                label: '订单金额',
                                name: 'amount',
                                type: 'number',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '本地下单',
                                name: 'check_in_time',
                                type: 'date',
                                width: 80,
                                sortable: true
                            },
                            {
                                label: '本地状态',
                                name: 'local_status',
                                type: 'string',
                                width: 60,
                                formatter: 'dictionary-remote:' + helper.remoteServiceUrl('share/dictionary/IDC01/object')
                            },
                            {
                                label: '远端支付',
                                name: 'UUpaystatus',
                                type: 'string',
                                width: 60,
                                formatter: 'dictionary-local:{"0":"景区到付","1":"已成功","2":"未支付"}'
                            },
                            {
                                label: '远端订单',
                                name: 'UUstatus',
                                type: 'string',
                                width: 60,
                                formatter: 'dictionary-local:{"0":"未使用","1":"已使用","2":"已过期","3":"被取消","4":"凭证码被替代","5":"被终端修改","6":"被终端撤销","7":"部分使用"}'
                            },
                            {
                                label: '凭证号',
                                name: 'UUcode',
                                type: 'string',
                                width: 60
                            },
                            {
                                label: '下单人',
                                name: 'member',
                                type: 'string',
                                width: 80
                            },
                            {
                                label: '联系人',
                                name: 'link_man',
                                type: 'string',
                                width: 60
                            },
                            {
                                label: '联系电话',
                                name: 'link_phone',
                                type: 'string',
                                width: 60
                            },
                            {
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 90
                            }
                        ],
                        switches: {leftTree: true}
                    })
                }
            })
            .state('app.organization-travel.financial-org-receipts-and-disbursements-details', {
                url: '/financial-org-receipts-and-disbursements-details',
                title: '收支明细',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-travel/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-travel.ORG-RECEIPTS-AND-DISBURSEMENTS-DETAILS'//业务系统使用
                }
                , resolve: helper.resolveFor('subsystem.organization-travel.financial-org-receipts-and-disbursements-details.js')
            })
            .state('app.organization-travel.financial-org-receipts-and-disbursements-details.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('organization-travel/financial-org-receipts-and-disbursements-details-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'FinancialORGReceiptsAndDisbursementsDetailsGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-travel.financial-org-receipts-and-disbursements-details.list', {
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
            .state('app.organization-travel.user-manage', {
                url: '/user-manage',
                title: '用户管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/organization-travel/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-travel.USER-MANAGE'//业务系统使用
                }
                , resolve: helper.resolveFor('subsystem.organization-travel.user-manage.js')
            })
            .state('app.organization-travel.user-manage.list', {
                url: '/list/:action/:roles',
                templateUrl: helper.basepath('organization-travel/user-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'UserManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.organization-travel.user-manage.list', {
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
            .state('app.organization-travel.user-manage.details', {
                url: '/details/:action/:_id/:roles',
                templateUrl: helper.basepath('organization-travel/user-manage-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'UserManageDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.organization-travel.user-manage.details', {
                        modelName: 'pub-user',
                        model: {type:'A0002'},
                        blockUI: true,
                        toList: ['roles']
                    })
                }
            })
            .state('app.organization-travel.system-log', {
                url: '/system-log',
                title: '系统日志',
                templateUrl: helper.basepath('organization-travel/system-log.html'),
                access_level: AUTH_ACCESS_LEVELS.ADMIN
            })
        ;

    } // routesConfig

})();

