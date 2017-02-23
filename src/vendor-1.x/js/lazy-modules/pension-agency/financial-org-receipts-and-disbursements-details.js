/**
 * financial-org-receipts-and-disbursements-details.controller Created by zppro on 16-6-28.
 * Target:机构收支明细
 */

(function() {
    'use strict';

    angular
        .module('subsystem.pension-agency')
        .controller('FinancialORGReceiptsAndDisbursementsDetailsGridController', FinancialORGReceiptsAndDisbursementsDetailsGridController)
    ;


    FinancialORGReceiptsAndDisbursementsDetailsGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function FinancialORGReceiptsAndDisbursementsDetailsGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});

            vm.query();
        }
    }

})();