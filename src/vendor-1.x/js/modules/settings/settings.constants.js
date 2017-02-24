/**=========================================================
 * Module: constants.js
 * Define constants to inject across the application
 =========================================================*/

(function() {
    'use strict';

    angular
        .module('app.settings')
        .constant('SETTING_KEYS', {
            'CURRENT_SUBSYSTEM' :'currentSubsystem',
            'STORAGE_ID_MERCHANT_WEBSTORE': 'merchant_webstore',
            'STORAGE_ID_PENSION_AGENCY': 'pension_agency',
            'STORAGE_ID_HEALTH_CENTER': 'health_center',
            'STORAGE_ID_ORGANIZATION_TRAVEL': 'organization_travel',
            'STORAGE_ID_MANAGE_CENTER': 'manage_center',
            'SREF_MERCHANT_WEBSTORE': 'app.merchant-webstore',
            'SREF_PENSION_AGENCY': 'app.pension-agency',
            'SREF_HEALTH_CENTER': 'app.health-center',
            'SREF_ORGANIZATION_TRAVEL': 'app.organization-travel',
            'SREF_MANAGE_CENTER': 'app.manage-center'
        })
      ;

})();