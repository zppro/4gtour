(function() {
    'use strict';
    var DOT_CHAR = '.';
    var APP ='app';
    var STATE_PREFIX = APP + DOT_CHAR,
        VM_PREFIX = APP + DOT_CHAR,
        RES_PREFIX ='subsystem' + DOT_CHAR;
    var MERCHANT_WEBSTORE = 'merchant-webstore',
        PENSION_AGENCY = 'pension-agency',
        HEALTH_CENTER = 'health-center',
        ORGANIZATION_TRAVEL = 'organization-travel',
        MANAGE_CENTER = 'manage-center',
        SHARED = 'shared';

    angular
        .module('app.routes')
        .constant('MODEL_VARIABLES', {
            PRE_DEFINED: {
                SERVER_GEN: 'server-gen'
            },
            CONTROLLER_NAMES: {
                MODULE_HEADER_FOR_TENANT: 'ModuleHeaderForTenantController',
                USER_MANAGE_GRID: 'Shared_UserManageGridController',
                USER_MANAGE_DETAILS: 'Shared_UserManageDetailsController',
                WXACONFIG_GRID: 'Shared_wxaConfigGridController',
                WXACONFIG_DETAILS: 'Shared_wxaConfigDetailsController'
            },
            SUBSYSTEM_NAMES: {
                MERCHANT_WEBSTORE: MERCHANT_WEBSTORE,
                PENSION_AGENCY: PENSION_AGENCY,
                HEALTH_CENTER: HEALTH_CENTER,
                ORGANIZATION_TRAVEL: ORGANIZATION_TRAVEL,
                MANAGE_CENTER: MANAGE_CENTER
            },
            STATE_PREFIXS: {
                ROOT: APP +DOT_CHAR,
                MERCHANT_WEBSTORE: STATE_PREFIX + MERCHANT_WEBSTORE + DOT_CHAR,
                PENSION_AGENCY: STATE_PREFIX+ PENSION_AGENCY + DOT_CHAR,
                HEALTH_CENTER: STATE_PREFIX + HEALTH_CENTER + DOT_CHAR,
                ORGANIZATION_TRAVEL: STATE_PREFIX+ ORGANIZATION_TRAVEL + DOT_CHAR,
                MANAGE_CENTER: STATE_PREFIX + MANAGE_CENTER + DOT_CHAR
            },
            VM_PREFIXS: {
                MERCHANT_WEBSTORE: VM_PREFIX + MERCHANT_WEBSTORE + DOT_CHAR,
                PENSION_AGENCY: VM_PREFIX+ PENSION_AGENCY + DOT_CHAR,
                HEALTH_CENTER: VM_PREFIX + HEALTH_CENTER + DOT_CHAR,
                ORGANIZATION_TRAVEL: VM_PREFIX+ ORGANIZATION_TRAVEL + DOT_CHAR,
                MANAGE_CENTER: VM_PREFIX + MANAGE_CENTER + DOT_CHAR
            },
            RES_PREFIXS:{
                MERCHANT_WEBSTORE: RES_PREFIX + MERCHANT_WEBSTORE + DOT_CHAR,
                PENSION_AGENCY: RES_PREFIX + PENSION_AGENCY + DOT_CHAR,
                HEALTH_CENTER: RES_PREFIX + HEALTH_CENTER + DOT_CHAR,
                ORGANIZATION_TRAVEL: RES_PREFIX + ORGANIZATION_TRAVEL + DOT_CHAR,
                MANAGE_CENTER: RES_PREFIX + MANAGE_CENTER + DOT_CHAR,
                SHARED: RES_PREFIX + SHARED + DOT_CHAR,
            },
            URLS:{
                MERCHANT_WEBSTORE: '/' + MERCHANT_WEBSTORE,
                PENSION_AGENCY: '/' + PENSION_AGENCY,
                HEALTH_CENTER: '/' + HEALTH_CENTER,
                ORGANIZATION_TRAVEL: '/' + ORGANIZATION_TRAVEL,
                MANAGE_CENTER: '/' + MANAGE_CENTER,
                SHARED: '/' + SHARED
            },
            HEAD_TEMPLATES:{
                MERCHANT_WEBSTORE: 'partials/' +  MERCHANT_WEBSTORE + '/module-header.html',
                PENSION_AGENCY: 'partials/' +  PENSION_AGENCY + '/module-header.html',
                HEALTH_CENTER: 'partials/' +  HEALTH_CENTER + '/module-header.html',
                ORGANIZATION_TRAVEL: 'partials/' +  ORGANIZATION_TRAVEL + '/module-header.html',
                MANAGE_CENTER: 'partials/' +  MANAGE_CENTER + '/module-header.html',
                SHARED:  'partials/module-header.html'
            },
            CONTENT_TEMPLATES:{
                MERCHANT_WEBSTORE: MERCHANT_WEBSTORE + '/',
                PENSION_AGENCY: PENSION_AGENCY + '/',
                HEALTH_CENTER: HEALTH_CENTER + '/' ,
                ORGANIZATION_TRAVEL: ORGANIZATION_TRAVEL + '/',
                MANAGE_CENTER: MANAGE_CENTER + '/'  ,
                SHARED: SHARED + '/'
            }
        })
    ;

})();
