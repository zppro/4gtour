/**
 * system-district-manage.controller Created by zppro on 16-4-19.
 * Target:租户管理房间
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
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

            vm.load().then(function () {
                switchDistrict();
                switchFloor();
            });

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