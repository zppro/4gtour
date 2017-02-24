/**
 * system-district-manage.controller Created by zppro on 17-2-22.
 * Target:自定义收费项目 (移植自fsrok)
 */

(function() {
    'use strict';

    angular
        .module('subsystem.shared')
        .controller('ChargeItemCustomizedGridController', ChargeItemCustomizedGridController)
        .controller('ChargeItemCustomizedDetailsController', ChargeItemCustomizedDetailsController)
    ;


    ChargeItemCustomizedGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function ChargeItemCustomizedGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});

            vm.query();
        }
    }

    ChargeItemCustomizedDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function ChargeItemCustomizedDetailsController($scope, ngDialog, vmh, vm) {

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