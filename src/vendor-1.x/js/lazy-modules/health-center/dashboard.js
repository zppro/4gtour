/**
 * dashboard Created by zppro on 17-2-16.
 * Target:系统管理员以上看的数据面板（俯瞰图）
 */
(function() {
    'use strict';

    angular
        .module('subsystem.health-center')
        .controller('DashboardHealthCenterController', DashboardHealthCenterController)
    ;

    DashboardHealthCenterController.$inject = ['$scope', '$echarts','vmh', 'instanceVM'];

    function DashboardHealthCenterController($scope, $echarts, vmh, vm) {
        $scope.vm = vm;

        init();

        function init() {

            vm.init();

        }
    }

})();