/**
 * dialog-exit-settlement.controller Created by zppro on 16-6-20.
 * Target:出院结算
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
        .controller('DialogExitSettlementController', DialogExitSettlementController)
    ;

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