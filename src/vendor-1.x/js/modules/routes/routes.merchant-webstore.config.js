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


        // 商户开始
        $stateProvider
            .state('app.merchant-webstore', {
                url: '/merchant-webstore',
                abstract: true,
                access_level: AUTH_ACCESS_LEVELS.USER,
                template: '<div class="module-header-wrapper" data-ui-view="module-header"></div><div class="module-content-wrapper" data-ui-view="module-content"></div>',
                resolve: {
                    vmh: helper.buildVMHelper()
                    // , deps: helper.resolveFor2('subsystem.merchant-webstore')
                }
            })
            .state('app.merchant-webstore.dashboard', {
                url: '/dashboard',
                title: '数据面板',
                access_level: AUTH_ACCESS_LEVELS.USER,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/merchant-webstore/module-header.html'),
                        controller: 'ModuleHeaderForTenantController'
                    },
                    "module-content": {
                        templateUrl: helper.basepath('merchant-webstore/dashboard.html'),
                        controller: 'DashboardControllerOfMerchantOfWebstoreController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM('app.merchant-webstore.dashboard')
                            , deps: helper.resolveFor2('subsystem.merchant-webstore.dashboard.js')
                        }
                    }
                }
                , resolve: helper.resolveFor('echarts.common','echarts-ng','classyloader')
            })
            .state('app.merchant-webstore.spu', {
                url: '/spu',
                title: '标准产品单元',
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
                    func_id:'menu.merchant-webstore.SPU'//业务系统使用
                }
                , resolve: helper.resolveFor('subsystem.merchant-webstore.spu.js')
            })
            .state('app.merchant-webstore.spu.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('merchant-webstore/spu-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'SPUGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.merchant-webstore.spu.list', {
                        modelName: 'mws-spu',
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
                                label: '产品名称',
                                name: 'name',
                                type: 'string',
                                width: 240,
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
                                label: '',
                                name: 'actions',
                                sortable: false,
                                width: 60
                            }
                        ]
                    })
                }
            })
            .state('app.merchant-webstore.spu.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('merchant-webstore/spu-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'SPUDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.merchant-webstore.spu.details', {
                        modelName: 'mws-spu',
                        blockUI: true
                    }), deps: helper.resolveFor2('qiniu','qiniu-ng')
                }
            })
            .state('app.merchant-webstore.order', {
                url: '/order',
                title: '订单',
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
                    func_id:'menu.merchant-webstore.ORDER'//业务系统使用
                }
                , resolve: helper.resolveFor('subsystem.merchant-webstore.order.js')
            })
            .state('app.merchant-webstore.order.list', {
                url: '/list/:action/:scenicSpotId',
                templateUrl: helper.basepath('merchant-webstore/order-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'MWS_OrderGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.merchant-webstore.order.list', {
                        modelName: 'mws-order',
                        searchForm: {"status": 1},
                        serverPaging: true,
                        blockUI: true,
                        columns: [
                            {
                                label: '订单号',
                                name: 'code',
                                type: 'string',
                                width: 80,
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
                                name: 'check_in_time',
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
                                width: 120
                            },
                            {
                                label: '收件人',
                                name: 'shipping_man',
                                type: 'string',
                                width: 120
                            },
                            {
                                label: '收件地址',
                                name: 'shipping_place',
                                type: 'string',
                                width: 120
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
            .state('app.merchant-webstore.user-manage', {
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
                    func_id:'menu.merchant-webstore.USER-MANAGE'//业务系统使用
                }
                , resolve: helper.resolveFor('subsystem.merchant-webstore.user-manage.js')
            })
            .state('app.merchant-webstore.user-manage.list', {
                url: '/list/:action/:roles',
                templateUrl: helper.basepath('merchant-webstore/user-manage-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'MerchantWebStoreUserManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.merchant-webstore.user-manage.list', {
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
            .state('app.merchant-webstore.user-manage.details', {
                url: '/details/:action/:_id/:roles',
                templateUrl: helper.basepath('merchant-webstore/user-manage-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'MerchantWebStoreUserManageDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.merchant-webstore.user-manage.details', {
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

