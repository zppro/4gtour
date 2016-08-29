/**
 * system-district-manage.controller Created by zppro on 16-4-19.
 * Target:租户管理片区
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
        .controller('DistrictManageGridController', DistrictManageGridController)
        .controller('DistrictManageDetailsController', DistrictManageDetailsController)
    ;


    DistrictManageGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function DistrictManageGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});
            vm.query();
        }
    }

    DistrictManageDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function DistrictManageDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;


        init();

        function init() {

            vm.init({removeDialog: ngDialog});


            vm.doSubmit = doSubmit;
            vm.tab1 = {cid: 'contentTab1'};

            vm.load();

        }


        function doSubmit() {

            if ($scope.theForm.$valid) {
                vm.save();
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
            }
        }


    }

})();