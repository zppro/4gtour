/**
 * dashboard Created by zppro on 16-12-2.
 * Target:系统管理员以上看的数据面板（俯瞰图）
 */
(function() {
    'use strict';

    angular
        .module('subsystem.organization-travel')
        .controller('DashboardOrganizationTravelController', DashboardOrganizationTravelController)
    ;

    DashboardOrganizationTravelController.$inject = ['$scope', '$echarts','extensionOfDashboardOfTenantNode','vmh', 'instanceVM'];

    function DashboardOrganizationTravelController($scope, $echarts,extensionOfDashboardOfTenantNode,vmh, vm) {
        $scope.vm = vm;

        init();


        function init() {

            vm.init();
            getDeviceStatInfo();
        }

        function getDeviceStatInfo(){
            extensionOfDashboardOfTenantNode.getDeviceStatInfo().then(function(ret){
                console.log(ret);
                vm.deviceStatInfo = ret;
            });
        }
    }

})();