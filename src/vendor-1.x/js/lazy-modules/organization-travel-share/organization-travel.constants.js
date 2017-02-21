/**=========================================================
 * Module: constants.js
 * Define constants to inject across the application
 =========================================================*/

(function() {
    'use strict';

    var ORG_PFTA_CHARGE_ITEM_PREFIX = 'charge-item.organization-travel.'

    angular
        .module('subsystem.organization-travel')
        .constant('ORG_TRAVEL_CHARGE_ITEM', {
            'ROOM': ORG_TRAVEL_CHARGE_ITEM_PREFIX + 'ROOM',
            'BOARD': ORG_PFTA_CHARGE_ITEM_PREFIX + 'BOARD',
            'NURSING': ORG_PFTA_CHARGE_ITEM_PREFIX + 'NURSING',
            'OTHER': ORG_PFTA_CHARGE_ITEM_PREFIX + 'OTHER',
            'CUSTOMIZED':ORG_PFTA_CHARGE_ITEM_PREFIX + 'CUSTOMIZED',
            'EXIT$ITEM_RETURN': 'EXIT-ITEM_RETURN',
            'EXIT$SETTLEMENT': 'EXIT-SETTLEMENT'
        })
      ;

})();