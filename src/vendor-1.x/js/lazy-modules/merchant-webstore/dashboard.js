/**
 * dashboard Created by zppro on 17-1-6.
 * Target:系统管理员以上看的数据面板（俯瞰图）
 */
(function() {
    'use strict';

    angular
        .module('subsystem.merchant-webstore.dashboard',[])
        .controller('DashboardControllerOfMerchantOfWebstoreController', DashboardControllerOfMerchantOfWebstoreController)
    ;

    DashboardControllerOfMerchantOfWebstoreController.$inject = ['$scope', '$echarts','extensionOfDashboardOfTenantNode','vmh', 'instanceVM'];

    function DashboardControllerOfMerchantOfWebstoreController($scope, $echarts,extensionOfDashboardOfTenantNode,vmh, vm) {
        $scope.vm = vm;

        init();

        function init() {

            vm.init();
        }
    }

})();