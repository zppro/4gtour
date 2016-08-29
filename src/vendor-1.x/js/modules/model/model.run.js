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
        //机构养老
        modelNode.factory('pfta-enter');
        modelNode.factory('pfta-exit');
        modelNode.factory('pfta-reception');
        modelNode.factory('pfta-leave');
        modelNode.factory('pfta-room');
        modelNode.factory('pfta-district');
        modelNode.factory('pfta-roomOccupancyChangeHistory');

        //管理中心
        modelNode.factory('pub-elderly');
        modelNode.factory('pub-recharge');
        modelNode.factory('pub-red');
        modelNode.factory('pub-tenant');
        modelNode.factory('pub-tenantJournalAccount');
        modelNode.factory('pub-tenantChargeItemCustomized');
        modelNode.factory('pub-user');
        modelNode.factory('pub-func');
        modelNode.factory('pub-order');

    }

})();