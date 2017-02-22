/**=========================================================
 * Module: config.js
 * App routes and resources configuration
 =========================================================*/


(function() {
    'use strict';

    angular
        .module('app.routes')
        .config(routesMerchantWebstoreConfig);

    routesMerchantWebstoreConfig.$inject = ['$stateProvider', 'RouteHelpersProvider', 'AUTH_ACCESS_LEVELS','MODEL_VARIABLES'];
    function routesMerchantWebstoreConfig($stateProvider, helper, AUTH_ACCESS_LEVELS,MODEL_VARIABLES) {


        // 网上商城开始
        $stateProvider
            .state(MODEL_VARIABLES.STATE_PREFIXS.ROOT + MODEL_VARIABLES.SUBSYSTEM_NAMES.MERCHANT_WEBSTORE, {
                url: '/merchant-webstore',
                abstract: true,
                access_level: AUTH_ACCESS_LEVELS.USER,
                template: '<div class="module-header-wrapper" data-ui-view="module-header"></div><div class="module-content-wrapper" data-ui-view="module-content"></div>',
                resolve: {
                    vmh: helper.buildVMHelper()
                    // , deps: helper.resolveFor2('subsystem.merchant-webstore')
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.MERCHANT_WEBSTORE + 'dashboard', {
                url: '/dashboard',
                title: '数据面板',
                access_level: AUTH_ACCESS_LEVELS.USER,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.MERCHANT_WEBSTORE),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.MERCHANT_WEBSTORE + 'dashboard.html'),
                        controller: 'DashboardControllerOfMerchantOfWebstoreController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM(MODEL_VARIABLES.VM_PREFIXS.MERCHANT_WEBSTORE + 'dashboard')
                            , deps: helper.resolveFor2(MODEL_VARIABLES.RES_PREFIXS.MERCHANT_WEBSTORE + 'dashboard.js')
                        }
                    }
                }
                , resolve: helper.resolveFor('echarts.common','echarts-ng','classyloader')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.MERCHANT_WEBSTORE + 'spu', {
                url: '/spu',
                title: '标准产品单元',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.MERCHANT_WEBSTORE),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.merchant-webstore.SPU'//业务系统使用
                }
                , resolve: helper.resolveFor(MODEL_VARIABLES.RES_PREFIXS.MERCHANT_WEBSTORE + 'spu.js')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.MERCHANT_WEBSTORE + 'spu.list', {
                url: '/list/:action',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.MERCHANT_WEBSTORE + 'spu-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'SPUGridController',
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.MERCHANT_WEBSTORE + 'spu.list', {
                        modelName: 'mws-spu',
                        searchForm: {"status": 1},
                        sortColumn: 'order_no',
                        sortDirection: 1,
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
                                label: '产品名称',
                                name: 'name',
                                type: 'string',
                                width: 240,
                                sortable: true
                            },
                            {
                                label: '上架',
                                name: 'publish_flag',
                                type: 'bool',
                                width: 40,
                                sortable: true
                            },
                            {
                                label: '销售价',
                                name: 'sales_price',
                                type: 'number',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '市场价',
                                name: 'market_price',
                                type: 'number',
                                width: 120,
                                sortable: true
                            },
                            {
                                label: '月销量',
                                name: 'sales_monthly',
                                type: 'number',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '总销量',
                                name: 'sales_all',
                                type: 'number',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '排序序号',
                                name: 'order_no',
                                type: 'number',
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.MERCHANT_WEBSTORE + 'spu.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.MERCHANT_WEBSTORE + 'spu-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'SPUDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.MERCHANT_WEBSTORE + 'spu.details', {
                        modelName: 'mws-spu',
                        model: {skus: [], imgs: []},
                        blockUI: true
                    }), deps: helper.resolveFor2('qiniu','qiniu-ng')
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.MERCHANT_WEBSTORE + 'order', {
                url: '/order',
                title: '订单',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.MERCHANT_WEBSTORE),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.merchant-webstore.ORDER'//业务系统使用
                }
                , resolve: helper.resolveFor(MODEL_VARIABLES.RES_PREFIXS.MERCHANT_WEBSTORE + 'order.js')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.MERCHANT_WEBSTORE + 'order.list', {
                url: '/list/:action',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.MERCHANT_WEBSTORE + 'order-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'MWS_OrderGridController',
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.MERCHANT_WEBSTORE + 'order.list', {
                        modelName: 'mws-order',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        blockUI: true,
                        columns: [
                            {
                                label: '订单号',
                                name: 'code',
                                type: 'string',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '订单金额',
                                name: 'amount',
                                type: 'number',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '支付方式',
                                name: 'pay_type_name',
                                type: 'string',
                                width: 60
                            },
                            {
                                label: '支付时间',
                                name: 'pay_time',
                                type: 'date',
                                width: 80,
                                sortable: true
                            },
                            {
                                label: '订单状态',
                                name: 'order_status_name',
                                type: 'string',
                                width: 60
                            },
                            {
                                label: '下单人',
                                name: 'order_man',
                                type: 'string',
                                width: 80
                            },
                            {
                                label: '收件人',
                                name: 'shipping_man',
                                type: 'string',
                                width: 80
                            },
                            {
                                label: '收件地址',
                                name: 'shipping_place',
                                type: 'string',
                                width: 200
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.MERCHANT_WEBSTORE + 'order.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.MERCHANT_WEBSTORE + 'order-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'NWS_OrderDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.MERCHANT_WEBSTORE + 'order.details', {
                        modelName: 'mws-order',
                        model: {items: [], tracking: []},
                        blockUI: true
                    })
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.MERCHANT_WEBSTORE + 'after-sale', {
                url: '/after-sale',
                title: '售后',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.MERCHANT_WEBSTORE),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.merchant-webstore.AFTER-SALE'//业务系统使用
                }
                , resolve: helper.resolveFor(MODEL_VARIABLES.RES_PREFIXS.MERCHANT_WEBSTORE + 'after-sale.js')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.MERCHANT_WEBSTORE + 'after-sale.list', {
                url: '/list/:action/:type',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.MERCHANT_WEBSTORE + 'after-sale-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'MWS_AfterSaleGridController',
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.MERCHANT_WEBSTORE + 'after-sale.list', {
                        modelName: 'mws-afterSale',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        blockUI: true,
                        columns: [
                            {
                                label: '售后号',
                                name: 'code',
                                type: 'string',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '申请时间',
                                name: 'check_in_time',
                                type: 'date',
                                width: 80,
                                sortable: true
                            },
                            {
                                label: '售后状态',
                                name: 'biz_status_name',
                                type: 'string',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '售后类型',
                                name: 'type_name',
                                type: 'string',
                                width: 60
                            },
                            {
                                label: '订单号',
                                name: 'order_code',
                                type: 'string',
                                width: 60
                            },
                            {
                                label: '受理结果',
                                name: 'audit_result_name',
                                type: 'string',
                                width: 80
                            },
                            {
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 60
                            }
                        ],
                        switches: {leftTree: true}
                    })
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.MERCHANT_WEBSTORE + 'after-sale.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.MERCHANT_WEBSTORE + 'after-sale-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'NWS_AfterSaleDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.MERCHANT_WEBSTORE + 'after-sale.details', {
                        modelName: 'mws-afterSale',
                        model: {},
                        blockUI: true
                    })
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.MERCHANT_WEBSTORE + 'channel-unit', {
                url: '/channel-unit',
                title: '渠道',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.MERCHANT_WEBSTORE),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.merchant-webstore.CHANNEL-UNIT'//业务系统使用
                }
                , resolve: helper.resolveFor(MODEL_VARIABLES.RES_PREFIXS.MERCHANT_WEBSTORE + 'channel-unit.js')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.MERCHANT_WEBSTORE + 'channel-unit.list', {
                url: '/list/:action/:parentId',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.MERCHANT_WEBSTORE + 'channel-unit-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'MWS_ChannelUnitGridController',
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.MERCHANT_WEBSTORE + 'channel-unit.list', {
                        modelName: 'mws-channelUnit',
                        searchForm: {"status": 1},
                        sortColumn: 'code',
                        sortDirection: 1,
                        omitStateParamToSearchForm: true,
                        serverPaging: true,
                        blockUI: true,
                        columns: [
                            {
                                label: '渠道编码',
                                name: 'code',
                                type: 'string',
                                width: 80,
                                sortable: true
                            },
                            {
                                label: '渠道名称',
                                name: 'name',
                                type: 'string',
                                width: 200,
                                sortable: true
                            },
                            {
                                label: '类型',
                                name: 'type_name',
                                type: 'string',
                                width: 80
                            },
                            {
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 60
                            }
                        ],
                        switches: {leftTree: true},
                        toDetails: ['parentId']
                    })
                    , deps: helper.resolveFor2('file-saver')
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.MERCHANT_WEBSTORE + 'channel-unit.details', {
                url: '/details/:action/:_id/:parentId',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.MERCHANT_WEBSTORE + 'channel-unit-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'NWS_ChannelUnitDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.MERCHANT_WEBSTORE + 'channel-unit.details', {
                        modelName: 'mws-channelUnit',
                        model: {},
                        blockUI: true,
                        toList: ['parentId']
                    })
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.MERCHANT_WEBSTORE + 'user-manage', {
                url: '/user-manage',
                title: '用户管理',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.MERCHANT_WEBSTORE),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.merchant-webstore.USER-MANAGE'//业务系统使用
                }
                , resolve: helper.resolveFor(MODEL_VARIABLES.RES_PREFIXS.SHARED + 'user-manage.js')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.MERCHANT_WEBSTORE + 'user-manage.list', {
                url: '/list/:action/:roles',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.SHARED + 'user-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: MODEL_VARIABLES.CONTROLLER_NAMES.USER_MANAGE_GRID,
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.MERCHANT_WEBSTORE + 'user-manage.list', {
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.MERCHANT_WEBSTORE + 'user-manage.details', {
                url: '/details/:action/:_id/:roles',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.SHARED + 'user-manage-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: MODEL_VARIABLES.CONTROLLER_NAMES.USER_MANAGE_DETAILS,
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.MERCHANT_WEBSTORE + 'user-manage.details', {
                        modelName: 'pub-user',
                        model: {type:'A0002'},
                        blockUI: true,
                        toList: ['roles']
                    })
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.MERCHANT_WEBSTORE + 'wx-app-config', {
                url: '/wx-app-config',
                title: '微信app',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.MERCHANT_WEBSTORE),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER_FOR_TENANT
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                },
                data:{
                    func_id:'menu.merchant-webstore.WX-APP-CONFIG'//业务系统使用
                }
                , resolve: helper.resolveFor(MODEL_VARIABLES.RES_PREFIXS.MERCHANT_WEBSTORE + 'wx-app-config.js')
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.MERCHANT_WEBSTORE + 'wx-app-config.list', {
                url: '/list/:action',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.MERCHANT_WEBSTORE + 'wx-app-config-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'MWS_wxAppConfigGridController',
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.MERCHANT_WEBSTORE + 'wx-app-config.list', {
                        modelName: 'mws-wxAppConfig',
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.MERCHANT_WEBSTORE + 'wx-app-config.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.MERCHANT_WEBSTORE + 'wx-app-config-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'MWS_wxAppConfigDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.MERCHANT_WEBSTORE + 'wx-app-config.details', {
                        modelName: 'mws-wxAppConfig',
                        model: {templates: []},
                        blockUI: true
                    }), deps: helper.resolveFor2('qiniu','qiniu-ng')
                }
            })
        ;

    } // routesConfig

})();

