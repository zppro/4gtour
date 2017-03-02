/**
 * receipts-and-disbursements Created by zppro on 17-3-2.
 * Target:机构收支明细 (移植自fsrok)
 */

(function() {
    'use strict';

    angular
        .module('subsystem.pension-agency')
        .controller('ReceiptsAndDisbursementsGridController', ReceiptsAndDisbursementsGridController)
    ;


    ReceiptsAndDisbursementsGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function ReceiptsAndDisbursementsGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});

            vm.query();
        }
    }

})();