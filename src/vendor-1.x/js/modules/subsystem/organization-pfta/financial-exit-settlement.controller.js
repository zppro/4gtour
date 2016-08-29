/**
 * material-exit-item-return.controller Created by zppro on 16-6-20.
 * Target:出院财务结算
 */
(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
        .controller('FinancialExitSettlementGridController', FinancialExitSettlementGridController)
    ;


    FinancialExitSettlementGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function FinancialExitSettlementGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});

            vm.query();
        }

    }

})();