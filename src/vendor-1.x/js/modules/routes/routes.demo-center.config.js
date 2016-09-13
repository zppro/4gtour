/**=========================================================
 * Module: config.js
 * App routes and resources configuration
 =========================================================*/


(function() {
    'use strict';

    angular
        .module('app.routes')
        .config(routesDemoCenterConfig);

    routesDemoCenterConfig.$inject = ['$stateProvider', 'RouteHelpersProvider', 'AUTH_ACCESS_LEVELS','MODEL_VARIABLES'];
    function routesDemoCenterConfig($stateProvider, helper, AUTH_ACCESS_LEVELS,MODEL_VARIABLES) {


        // 演示中心开始
        $stateProvider
            .state('app.demo-center', {
                url: '/demo-center',
                abstract: true,
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                template: '<div class="module-header-wrapper" data-ui-view="module-header"></div><div class="module-content-wrapper" data-ui-view="module-content"></div>',
                resolve: {
                    vmh: helper.buildVMHelper()
                    , deps: helper.resolveFor2('app.demo')
                }
            })
            .state('app.demo-center.grid-basic', {
                url: '/grid-basic',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/module-header.html'),
                        controller: 'ModuleHeaderController'
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                }
            })
            .state('app.demo-center.grid-basic.list', {
                url: '/list/:action',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                templateUrl: helper.basepath('demo-center/grid-basic-list.html'),
                controller: 'DemoGridBasicController',
                resolve: {
                    entryVM: helper.buildEntryVM('app.demo-center.grid-basic.list', {
                        columns: [
                            {
                                label: 'ID',
                                name: 'id',
                                type: 'string',
                                width: 60
                            },
                            {
                                label: '姓名',
                                name: 'name',
                                type: 'string',
                                width: 200
                            },
                            {
                                label: '生日',
                                name: 'birthday',
                                type: 'date',
                                width: 120
                            },
                            {
                                label: '粉丝数',
                                name: 'followers',
                                type: 'number',
                                hidden: true
                            },
                            {
                                label: '收入',
                                name: 'income',
                                type: 'currency'
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
            .state('app.demo-center.grid-basic.details', {
                url: '/details/:action/:_id',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                templateUrl: helper.basepath('demo-center/grid-basic-details.html'),
                controller: 'DemoGridBasicDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM('app.demo-center.grid-basic.details', {
                        blockUI: true
                    })
                }
            })
            .state('app.demo-center.tree-basic', {
                url: '/tree-basic',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/module-header.html'),
                        controller: 'ModuleHeaderController'
                    },
                    "module-content": {
                        templateUrl: helper.basepath('demo-center/tree-basic.html'),
                        controller: 'DemoTreeBasicController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM('app.demo-center.tree-basic')
                        }
                    }
                }
            })
            .state('app.demo-center.tree-extend', {
                url: '/tree-extend',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/module-header.html'),
                        controller: 'ModuleHeaderController'
                    },
                    "module-content": {
                        templateUrl: helper.basepath('demo-center/tree-extend.html'),
                        controller: 'DemoTreeExtendController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM('app.demo-center.tree-extend')
                        }
                    }
                }
            })
            .state('app.demo-center.tree-directive', {
                url: '/tree-directive',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/module-header.html'),
                        controller: 'ModuleHeaderController'
                    },
                    "module-content": {
                        templateUrl: helper.basepath('demo-center/tree-directive.html'),
                        controller: 'DemoTreeDirectiveController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM('app.demo-center.tree-directive')
                        }
                    }
                }
            })
            .state('app.demo-center.tree-nav', {
                url: '/tree-nav',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/module-header.html'),
                        controller: 'ModuleHeaderController'
                    },
                    "module-content": {
                        templateUrl: helper.basepath('demo-center/tree-nav.html'),
                        controller: 'DemoTreeNavController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM('app.demo-center.tree-nav')
                        }
                    }
                }
            })
            .state('app.demo-center.tree-tile', {
                url: '/tree-tile',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/module-header.html'),
                        controller: 'ModuleHeaderController'
                    },
                    "module-content": {
                        templateUrl: helper.basepath('demo-center/tree-tile.html'),
                        controller: 'DemoTreeTileController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM('app.demo-center.tree-tile')
                        }
                    }
                }
            })
            .state('app.demo-center.img-process-qiniu', {
                url: '/img-process-qiniu',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/module-header.html'),
                        controller: 'ModuleHeaderController'
                    },
                    "module-content": {
                        templateUrl: helper.basepath('demo-center/img-process-qiniu.html'),
                        controller: 'DemoIMGProcessQiNiuController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM('app.demo-center.img-process-qiniu')
                            , deps: helper.resolveFor2('qiniu')
                        }
                    }
                }
            })
            .state('app.demo-center.dropdown', {
                url: '/dropdown',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/module-header.html'),
                        controller: 'ModuleHeaderController'
                    },
                    "module-content": {
                        templateUrl: helper.basepath('demo-center/dropdown.html'),
                        controller: 'DemoDropdownController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM('app.demo-center.dropdown')
                        }
                    }
                }
            })
            .state('app.demo-center.box-input', {
                url: '/box-input',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/module-header.html'),
                        controller: 'ModuleHeaderController'
                    },
                    "module-content": {
                        templateUrl: helper.basepath('demo-center/box-input.html'),
                        controller: 'DemoBoxInputController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM('app.demo-center.box-input')
                        }
                    }
                }
            })
            .state('app.demo-center.promise', {
                url: '/promise',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath('partials/module-header.html'),
                        controller: 'ModuleHeaderController'
                    },
                    "module-content": {
                        templateUrl: helper.basepath('demo-center/promise.html'),
                        controller: 'DemoPromiseController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM('app.demo-center.promise')
                        }
                    }
                }
            })
        ;

    } // routesConfig

})();

