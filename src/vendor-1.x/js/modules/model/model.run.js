/**
 * Created by zppro on 16-3-14.
 */
(function() {
    'use strict';

    angular
        .module('app.model')
        .run(modelRun)
    ;
    modelRun.$inject = ['modelNode'];
    function modelRun(modelNode) {
        //商户机构
        modelNode.factory('trv-scenerySpot');

        modelNode.factory('idc-scenicSpot_PFT');
        modelNode.factory('idc-ticket_PFT');
        modelNode.factory('idc-order_PFT');
        // modelNode.factory('pfta-room');
        // modelNode.factory('pfta-district');
        // modelNode.factory('pfta-roomOccupancyChangeHistory');

        //管理中心 
        modelNode.factory('pub-red');
        modelNode.factory('pub-tenant');
        modelNode.factory('pub-tenantJournalAccount');
        modelNode.factory('pub-user');
        modelNode.factory('pub-func');
        modelNode.factory('pub-order');
        modelNode.factory('pub-appServerSideUpdateHistory');
    }

})();