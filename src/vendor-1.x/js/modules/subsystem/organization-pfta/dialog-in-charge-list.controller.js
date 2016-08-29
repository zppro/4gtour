/**
 * dialog-in-charge-list.controller Created by zppro on 16-6-23.
 * Target:老人在院费用清单
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
        .controller('DialogInChargeListController', DialogInChargeListController)
    ;

    DialogInChargeListController.$inject = ['$scope','ngDialog'];

    function DialogInChargeListController($scope,ngDialog) {

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
            vm.elderlyId = $scope.ngDialogData.elderlyId;

            vm.cancel = cancel;

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

    }

})();