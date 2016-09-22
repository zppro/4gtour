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
                                label: '景区名称',
                                name: 'UUtitle',
                                type: 'string',
                                width: 240,
                                sortable: true
                            },
                            {
                                label: '景区添加时间',
                                name: 'UUaddtime',
                                type: 'date',
                                width: 60,
                                sortable: true
                            },
                            {
                                label: '所在地区',
                                name: 'UUarea',
                                type: 'string',
                                width: 120,
                                sortable: true
                            },
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

