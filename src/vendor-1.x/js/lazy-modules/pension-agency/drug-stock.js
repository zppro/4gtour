// Created by yrm on 17-3-28.
(function() {
    'use strict';
    
    angular
        .module('subsystem.pension-agency')
        .controller('DrugStockGridController',DrugStockGridController)
        .controller('DrugStockDetailsController',DrugStockDetailsController)
    ;

    DrugStockGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function  DrugStockGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});
            vm.query();
        }
    }
    DrugStockDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function  DrugStockDetailsController($scope, ngDialog, vmh, vm) {

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