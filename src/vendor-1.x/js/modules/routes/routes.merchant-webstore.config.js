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
                    , deps: helper.resolveFor2('subsystem.merchant-webstore')
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
                        controller: 'DashboardControllerOfOrganizationOfTravelController',
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
                title: '景区',
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
                    func_id:'menu.merchant-webstore.spu'//业务系统使用
                }
                , resolve: helper.resolveFor('subsystem.merchant-webstore.spu.js')
            })
            .state('app.merchant-webstore.spu.list', {
                url: '/list/:action',
                templateUrl: helper.basepath('merchant-webstore/spu-PFT-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'PFT_ScenicSpotGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.merchant-webstore.spu.list', {
                        modelName: 'idc-scenicSpot_PFT',
                        searchForm: {"status": 1},
                        transTo: {
                            "ticket": 'app.merchant-webstore.ticket.list',
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
            .state('app.merchant-webstore.spu.details', {
                url: '/details/:action/:_id',
                templateUrl: helper.basepath('merchant-webstore/spu-PFT-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'PFT_ScenicSpotDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.merchant-webstore.spu.details', {
                        modelName: 'idc-scenicSpot_PFT',
                        blockUI: true
                    })
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
                templateUrl: helper.basepath('merchant-webstore/order-PFT-list.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'PFT_OrderGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.merchant-webstore.order.list', {
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
                controller: 'UserManageGridController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.merchant-webstore.user-manage.list', {
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
            .state('app.merchant-webstore.user-manage.details', {
                url: '/details/:action/:_id/:roles',
                templateUrl: helper.basepath('merchant-webstore/user-manage-details.html'),
                access_level: AUTH_ACCESS_LEVELS.USER,
                controller: 'UserManageDetailsController',
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

