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
            .state(MODEL_VARIABLES.STATE_PREFIXS.ROOT + MODEL_VARIABLES.SUBSYSTEM_NAMES.ORGANIZATION_TRAVEL, {
                url: '/organization-travel',
                abstract: true,
                access_level: AUTH_ACCESS_LEVELS.USER,
                template: '<div class="module-header-wrapper" data-ui-view="module-header"></div><div class="module-content-wrapper" data-ui-view="module-content"></div>',
                resolve: {
                    vmh: helper.buildVMHelper()
                    // , deps: helper.resolveFor2(MODEL_VARIABLES.RES_PREFIXS.ORGANIZATION_TRAVEL)
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.ORGANIZATION_TRAVEL + 'dashboard', {
                url: '/dashboard',
                title: '数据面板',
                access_level: AUTH_ACCESS_LEVELS.USER,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.ORGANIZATION_TRAVEL),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.ORGANIZATION_TRAVEL + 'dashboard.html'),
                        controller: 'DashboardControllerOfOrganizationOfTravelController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM(MODEL_VARIABLES.VM_PREFIXS.ORGANIZATION_TRAVEL + 'dashboard')
                            , deps: helper.resolveFor2(MODEL_VARIABLES.RES_PREFIXS.ORGANIZATION_TRAVEL + 'dashboard.js')
                        }
                    }
                }
                , resolve: helper.resolveFor('echarts.common','echarts-ng','classyloader')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.ORGANIZATION_TRAVEL + 'scenery-spot', {
                url: '/scenery-spot',
                title: '景点',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.ORGANIZATION_TRAVEL),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-travel.SCENERY-SPOT'//业务系统使用
                }
                , resolve: helper.resolveFor(MODEL_VARIABLES.RES_PREFIXS.ORGANIZATION_TRAVEL + 'scenery-spot.js')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.ORGANIZATION_TRAVEL + 'scenery-spot.list', {
                url: '/list/:action',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.ORGANIZATION_TRAVEL + 'scenery-spot-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'ScenerySpotGridController',
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.ORGANIZATION_TRAVEL + 'scenery-spot.list', {
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.ORGANIZATION_TRAVEL + 'scenery-spot.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.ORGANIZATION_TRAVEL + 'scenery-spot-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'ScenerySpotDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.ORGANIZATION_TRAVEL + 'scenery-spot.details', {
                        modelName: 'trv-scenerySpot',
                        model: {
                            code: MODEL_VARIABLES.PRE_DEFINED.SERVER_GEN,
                            level: 'AAAAA'
                        },
                        blockUI: true
                    }), deps: helper.resolveFor2('qiniu','qiniu-ng')
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.ORGANIZATION_TRAVEL + 'scenic-spot', {
                url: '/scenic-spot',
                title: '景区',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.ORGANIZATION_TRAVEL),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-travel.SCENIC-SPOT'//业务系统使用
                }
                , resolve: helper.resolveFor(MODEL_VARIABLES.RES_PREFIXS.ORGANIZATION_TRAVEL + 'scenic-spot.js')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.ORGANIZATION_TRAVEL + 'scenic-spot.list', {
                url: '/list/:action',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.ORGANIZATION_TRAVEL + 'scenic-spot-PFT-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'PFT_ScenicSpotGridController',
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.ORGANIZATION_TRAVEL + 'scenic-spot.list', {
                        modelName: 'idc-scenicSpot_PFT',
                        searchForm: {"status": 1},
                        transTo: {
                            "ticket": MODEL_VARIABLES.STATE_PREFIXS.ORGANIZATION_TRAVEL + 'ticket.list',
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.ORGANIZATION_TRAVEL + 'scenic-spot.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.ORGANIZATION_TRAVEL + 'scenic-spot-PFT-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'PFT_ScenicSpotDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.ORGANIZATION_TRAVEL + 'scenic-spot.details', {
                        modelName: 'idc-scenicSpot_PFT',
                        blockUI: true
                    })
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.ORGANIZATION_TRAVEL + 'ticket', {
                url: '/ticket',
                title: '票务',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.ORGANIZATION_TRAVEL),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-travel.TICKET'//业务系统使用
                }
                , resolve: helper.resolveFor(MODEL_VARIABLES.RES_PREFIXS.ORGANIZATION_TRAVEL + 'ticket.js')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.ORGANIZATION_TRAVEL + 'ticket.list', {
                url: '/list/:action/:scenicSpotId',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.ORGANIZATION_TRAVEL + 'ticket-PFT-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'PFT_TicketGridController',
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.ORGANIZATION_TRAVEL + 'ticket.list', {
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.ORGANIZATION_TRAVEL + 'ticket.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.ORGANIZATION_TRAVEL + 'ticket-PFT-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'PFT_TicketDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.ORGANIZATION_TRAVEL + 'ticket.details', {
                        modelName: 'idc-ticket_PFT',
                        blockUI: true
                    })
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.ORGANIZATION_TRAVEL + 'order', {
                url: '/order',
                title: '订单',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.ORGANIZATION_TRAVEL),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-travel.ORDER'//业务系统使用
                }
                , resolve: helper.resolveFor(MODEL_VARIABLES.RES_PREFIXS.ORGANIZATION_TRAVEL + 'order.js')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.ORGANIZATION_TRAVEL + 'order.list', {
                url: '/list/:action/:scenicSpotId',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.ORGANIZATION_TRAVEL + 'order-PFT-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'PFT_OrderGridController',
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.ORGANIZATION_TRAVEL + 'order.list', {
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.ORGANIZATION_TRAVEL + 'user-manage', {
                url: '/user-manage',
                title: '用户管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.ORGANIZATION_TRAVEL),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.organization-travel.USER-MANAGE'//业务系统使用
                }
                , resolve: helper.resolveFor(MODEL_VARIABLES.RES_PREFIXS.SHARED + 'user-manage.js')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.ORGANIZATION_TRAVEL + 'user-manage.list', {
                url: '/list/:action/:roles',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.SHARED + 'user-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: MODEL_VARIABLES.CONTROLLER_NAMES.USER_MANAGE_GRID,
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.ORGANIZATION_TRAVEL + 'user-manage.list', {
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.ORGANIZATION_TRAVEL + 'app.organization-travel.user-manage.details', {
                url: '/details/:action/:_id/:roles',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.SHARED + 'user-manage-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: MODEL_VARIABLES.CONTROLLER_NAMES.USER_MANAGE_DETAILS,
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.ORGANIZATION_TRAVEL + 'user-manage.details', {
                        modelName: 'pub-user',
                        model: {type:'A0002'},
                        blockUI: true,
                        toList: ['roles']
                    })
                }
            })
        ;

    } // routesConfig

})();

