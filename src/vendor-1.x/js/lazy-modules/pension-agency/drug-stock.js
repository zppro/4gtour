// Created by yrm on 17-3-28.
(function() {
    'use strict';
    
    angular
        .module('subsystem.pension-agency')
        .controller('DrugStockGridController',DrugStockGridController)
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

})();