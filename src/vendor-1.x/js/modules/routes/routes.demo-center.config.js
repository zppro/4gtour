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
    function routesDemoCenterConfig($stateProvider, helper, AUTH_ACCESS_LEVELS, MODEL_VARIABLES) {


        // 演示中心开始
        $stateProvider
            .state(MODEL_VARIABLES.STATE_PREFIXS.ROOT + MODEL_VARIABLES.SUBSYSTEM_NAMES.DEMO_CENTER, {
                url: '/demo',
                abstract: true,
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                template: '<div class="module-header-wrapper" data-ui-view="module-header"></div><div class="module-content-wrapper" data-ui-view="module-content"></div>',
                resolve: {
                    vmh: helper.buildVMHelper()
                    , deps: helper.resolveFor2(MODEL_VARIABLES.RES_PREFIXS.DEMO_CENTER)
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.DEMO_CENTER + 'grid-basic', {
                url: '/grid-basic',
                abstract: true,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.DEMO_CENTER),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER
                    },
                    "module-content": {
                        template: '<div class="data-ui-view"></div>'
                    }
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.DEMO_CENTER + 'grid-basic.list', {
                url: '/list/:action',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.DEMO_CENTER + 'grid-basic-list.html'),
                controller: 'DemoGridBasicController',
                resolve: {
                    entryVM: helper.buildEntryVM(MODEL_VARIABLES.VM_PREFIXS.DEMO_CENTER + 'grid-basic.list', {
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
            .state(MODEL_VARIABLES.STATE_PREFIXS.DEMO_CENTER + 'grid-basic.details', {
                url: '/details/:action/:_id',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.DEMO_CENTER + 'grid-basic-details.html'),
                controller: 'DemoGridBasicDetailsController',
                resolve: {
                    entityVM: helper.buildEntityVM(MODEL_VARIABLES.VM_PREFIXS.DEMO_CENTER + 'grid-basic.details', {
                        blockUI: true
                    })
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.DEMO_CENTER + 'tree-basic', {
                url: '/tree-basic',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.DEMO_CENTER),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER
                    },
                    "module-content": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.DEMO_CENTER + 'tree-basic.html'),
                        controller: 'DemoTreeBasicController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM(MODEL_VARIABLES.VM_PREFIXS.DEMO_CENTER + 'tree-basic')
                        }
                    }
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.DEMO_CENTER + 'tree-extend', {
                url: '/tree-extend',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.DEMO_CENTER),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER
                    },
                    "module-content": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.DEMO_CENTER + 'tree-extend.html'),
                        controller: 'DemoTreeExtendController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM(MODEL_VARIABLES.VM_PREFIXS.DEMO_CENTER + 'tree-extend')
                        }
                    }
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.DEMO_CENTER + 'tree-directive', {
                url: '/tree-directive',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.DEMO_CENTER),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER
                    },
                    "module-content": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.DEMO_CENTER + 'tree-directive.html'),
                        controller: 'DemoTreeDirectiveController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM(MODEL_VARIABLES.VM_PREFIXS.DEMO_CENTER + 'tree-directive')
                        }
                    }
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.DEMO_CENTER + 'tree-nav', {
                url: '/tree-nav',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.DEMO_CENTER),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER
                    },
                    "module-content": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.DEMO_CENTER + 'tree-nav.html'),
                        controller: 'DemoTreeNavController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM(MODEL_VARIABLES.VM_PREFIXS.DEMO_CENTER + 'tree-nav')
                        }
                    }
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.DEMO_CENTER + 'tree-tile', {
                url: '/tree-tile',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.DEMO_CENTER),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER
                    },
                    "module-content": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.DEMO_CENTER + 'tree-tile.html'),
                        controller: 'DemoTreeTileController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM(MODEL_VARIABLES.VM_PREFIXS.DEMO_CENTER + 'tree-tile')
                        }
                    }
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.DEMO_CENTER + 'img-process-qiniu', {
                url: '/img-process-qiniu',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.DEMO_CENTER),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER
                    },
                    "module-content": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.DEMO_CENTER + 'img-process-qiniu.html'),
                        controller: 'DemoIMGProcessQiNiuController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM(MODEL_VARIABLES.VM_PREFIXS.DEMO_CENTER + 'img-process-qiniu')
                            , deps: helper.resolveFor2('qiniu','qiniu-ng')
                        }
                    }
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.DEMO_CENTER + 'dropdown', {
                url: '/dropdown',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.DEMO_CENTER),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER
                    },
                    "module-content": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.DEMO_CENTER + 'dropdown.html'),
                        controller: 'DemoDropdownController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM(MODEL_VARIABLES.VM_PREFIXS.DEMO_CENTER + 'dropdown')
                        }
                    }
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.DEMO_CENTER + 'box-input', {
                url: '/box-input',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.DEMO_CENTER),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER
                    },
                    "module-content": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.DEMO_CENTER + 'box-input.html'),
                        controller: 'DemoBoxInputController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM(MODEL_VARIABLES.VM_PREFIXS.DEMO_CENTER + 'box-input')
                        }
                    }
                }
            })
            .state(MODEL_VARIABLES.STATE_PREFIXS.DEMO_CENTER + 'promise', {
                url: '/promise',
                access_level: AUTH_ACCESS_LEVELS.ADMIN,
                views: {
                    "module-header": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.HEAD_TEMPLATES.DEMO_CENTER),
                        controller: MODEL_VARIABLES.CONTROLLER_NAMES.MODULE_HEADER
                    },
                    "module-content": {
                        templateUrl: helper.basepath(MODEL_VARIABLES.CONTENT_TEMPLATES.DEMO_CENTER + 'promise.html'),
                        controller: 'DemoPromiseController',
                        resolve: {
                            instanceVM: helper.buildInstanceVM(MODEL_VARIABLES.VM_PREFIXS.DEMO_CENTER + 'promise')
                        }
                    }
                }
            })
        ;

    } // routesConfig

})();

