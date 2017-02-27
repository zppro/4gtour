/**=========================================================
 * Module: constants.js
 * Define constants to inject across the application (移植自fsrok)
 =========================================================*/

(function() {
    'use strict';

    var CHARGE_ITEM_PREFIX = 'ci.pension-agency.'

    angular
        .module('subsystem.pension-agency')
        .constant('PENSION_AGENCY_CHARGE_ITEM', {
            'ROOM': CHARGE_ITEM_PREFIX + 'ROOM',
            'BOARD': CHARGE_ITEM_PREFIX + 'BOARD',
            'NURSING': CHARGE_ITEM_PREFIX + 'NURSING',
            'OTHER': CHARGE_ITEM_PREFIX + 'OTHER',
            'CUSTOMIZED':CHARGE_ITEM_PREFIX + 'CUSTOMIZED',
            'EXIT$ITEM_RETURN': 'EXIT-ITEM_RETURN',
            'EXIT$SETTLEMENT': 'EXIT-SETTLEMENT'
        })
      ;

})();