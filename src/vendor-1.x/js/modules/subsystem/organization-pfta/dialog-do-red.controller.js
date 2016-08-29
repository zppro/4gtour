/**
 * dialog-do-red.controller Created by zppro on 16-6-20.
 * Target:冲红
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
        .controller('DialogDoRedController', DialogDoRedController)
    ;

    DialogDoRedController.$inject = ['$scope','ngDialog'];

    function DialogDoRedController($scope,ngDialog) {

        var vm = $scope.vm = {};
        var vmh = $scope.ngDialogData.vmh;

        $scope.utils = vmh.utils.v;

        init();

        function init() {
            vm.viewTranslatePathRoot = $scope.ngDialogData.viewTranslatePathRoot;
            vm.viewTranslatePath = function (key) {
                return vm.viewTranslatePathRoot + '.' + key;
            };
            vm.title = $scope.ngDialogData.titleTranslatePath;
            vm.voucher_no_to_red = $scope.ngDialogData.voucher_no_to_red;
            vm.amount_booking = $scope.ngDialogData.amount_booking;
            vm.tenantId = $scope.ngDialogData.tenantId;
            vm.operated_by = $scope.ngDialogData.operated_by;
            vm.operated_by_name = $scope.ngDialogData.operated_by_name;

            vm.cancel = cancel;
            vm.doSubmit = doSubmit;

            if (vm.voucher_no_to_red) {
                vmh.parallel([
                    vmh.extensionService.checkCanBookingRed({
                        voucher_no_to_red: vm.voucher_no_to_red,
                        tenantId: vm.tenantId
                    })
                ]).then(function (results) {
                    console.log(results);
                    vm.isSystemInnerBooking = results[0].isSystemInnerBooking;
                });
            }
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
                        $scopeConfirm.message = vm.isSystemInnerBooking? vm. vm.viewTranslatePath('RED-CONFIRM-MESSAGE') : 'confirm.RED';
                    }]
                }).then(function () {

                    vmh.extensionService.bookingRed({
                        voucher_no_to_red: vm.voucher_no_to_red,
                        isSystemInnerBooking: vm.isSystemInnerBooking,
                        amount: vm.amount,
                        tenantId: vm.tenantId,
                        operated_by: vm.operated_by,
                        operated_by_name: vm.operated_by_name
                    }).then(function (ret) {
                        vmh.alertSuccess('notification.RED-SUCCESS',true);

                        $scope.closeThisDialog(ret);
                    }, function (err) {
                        vm.authMsg = err;
                    });
                });
            }
        }
    }

})();