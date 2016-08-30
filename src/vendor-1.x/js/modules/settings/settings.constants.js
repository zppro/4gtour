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
            'STORAGE_ID_ORGANIZATION_PFTA': 'organization_pfta',
            'STORAGE_ID_MANAGE_CENTER': 'manage_center',
            'SREF_ORGANIZATION_PFTA': 'app.organization-travel',
            'SREF_MANAGE_CENTER': 'app.manage-center'
        })
      ;

})();