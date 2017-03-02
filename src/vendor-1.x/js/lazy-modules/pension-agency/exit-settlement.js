/**
 * exit-settlement Created by zppro on 17-3-2.
 * Target:出院财务结算 (移植自fsrok)
 */
(function() {
    'use strict';

    angular
        .module('subsystem.pension-agency')
        .controller('ExitSettlementGridController', ExitSettlementGridController)
    ;


    ExitSettlementGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function ExitSettlementGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});

            vm.query();
        }

    }

})();