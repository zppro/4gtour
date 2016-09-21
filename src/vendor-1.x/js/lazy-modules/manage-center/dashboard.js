/**
 * dashboard Created by zppro on 16-7-22.
 * Target:云平台管理中心系统管理员以上看的数据面板（俯瞰图）
 */
(function() {
    'use strict';

    angular
        .module('subsystem.manage-center.dashboard',[])
        .controller('DashboardControllerOfManageCenterController', DashboardControllerOfManageCenterController)
    ;

    DashboardControllerOfManageCenterController.$inject = ['$parse','$scope','vmh', 'instanceVM'];

    function DashboardControllerOfManageCenterController($parse,$scope, vmh, vm) {
        $scope.vm = vm;
        init();

        function init() {

            vm.init();

            console.log('manage-center');
        }
    }

})();