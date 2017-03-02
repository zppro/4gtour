/**
 * exit-settlement Created by zppro on 17-3-2.
 * Target:出院财务结算 (移植自fsrok)
 */
(function() {
    'use strict';

    angular
        .module('subsystem.pension-agency')
        .controller('ExitSettlementGridController', ExitSettlementGridController)
        .controller('DialogExitSettlementController', DialogExitSettlementController)
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

    DialogExitSettlementController.$inject = ['$scope','ngDialog'];

    function DialogExitSettlementController($scope,ngDialog) {

        var vm = $scope.vm = {};
        var vmh = $scope.ngDialogData.vmh;

        $scope.utils = vmh.utils.v;

        init();

        function init() {
            vm.viewTranslatePathRoot = $scope.ngDialogData.viewTranslatePathRoot;
            vm.viewTranslatePath = function(key) {
                return vm.viewTranslatePathRoot + '.' + key;
            };
            vm.title = $scope.ngDialogData.titleTranslatePath;
            vm.exitId = $scope.ngDialogData.exitId;
            vm.elderlyId = $scope.ngDialogData.elderlyId;
            vm.operated_by = $scope.ngDialogData.operated_by;
            vm.operated_by_name = $scope.ngDialogData.operated_by_name;

            vm.cancel = cancel;
            vm.doSubmit = doSubmit;

            vmh.parallel([
                vmh.extensionService.advancePaymentItemsWhenExitSettlement(vm.exitId),
                vmh.extensionService.chargeItemsRecordedWhenExitSettlement(vm.exitId),
                vmh.extensionService.chargeItemsUnRecordedWhenExitSettlement(vm.exitId),
                vmh.extensionService.elderlyInfo(vm.elderlyId,'subsidiary_ledger')
            ]).then(function (results) {
                vm.advancePaymentItems = results[0];
                vm.chargeItemsRecorded = results[1];
                vm.chargeItemsUnRecorded = results[2];
                vm.subsidiary_ledger = results[3].subsidiary_ledger;
            });
        }

        function cancel(){
            $scope.closeThisDialog('$closeButton');
        }

        function doSubmit() {
            vm.authMsg = null;
            if ($scope.theForm.$valid) {
                var promise = ngDialog.openConfirm({
                    template: 'customConfirmDialog.html',
                    className: 'ngdialog-theme-default',
                    controller: ['$scope', function ($scopeConfirm) {
                        $scopeConfirm.message = vm.viewTranslatePath('TO-CONFIRM-SETTLEMENT-CONFIRM-MESSAGE')
                    }]
                }).then(function () {

                    //var ret = {
                    //    settlement_flag: true,
                    //    advance_payment_amount: vm.advancePayment,
                    //    charge_total: vm.recorded_charge_total + vm.unrecorded_charge_total
                    //};
                    //$scope.closeThisDialog(ret);

                    vmh.extensionService.exitSettlement(vm.exitId, {
                        operated_by: vm.operated_by,
                        operated_by_name: vm.operated_by_name
                    }).then(function (ret) {
                        $scope.closeThisDialog(ret);
                    }, function (err) {
                        vm.authMsg = err;
                    });
                });
            }
        }
    }

})();