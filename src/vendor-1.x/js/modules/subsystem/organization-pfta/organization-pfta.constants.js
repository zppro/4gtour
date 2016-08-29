/**=========================================================
 * Module: constants.js
 * Define constants to inject across the application
 =========================================================*/

(function() {
    'use strict';

    var ORG_PFTA_CHARGE_ITEM_PREFIX = 'charge-item.organization-pfta.'

    angular
        .module('subsystem.organization-pfta')
        .constant('ORG_PFTA_CHARGE_ITEM', {
            'ROOM': ORG_PFTA_CHARGE_ITEM_PREFIX + 'ROOM',
            'BOARD': ORG_PFTA_CHARGE_ITEM_PREFIX + 'BOARD',
            'NURSING': ORG_PFTA_CHARGE_ITEM_PREFIX + 'NURSING',
            'OTHER': ORG_PFTA_CHARGE_ITEM_PREFIX + 'OTHER',
            'CUSTOMIZED':ORG_PFTA_CHARGE_ITEM_PREFIX + 'CUSTOMIZED',
            'EXIT$ITEM_RETURN': 'EXIT-ITEM_RETURN',
            'EXIT$SETTLEMENT': 'EXIT-SETTLEMENT'
        })
      ;

})();