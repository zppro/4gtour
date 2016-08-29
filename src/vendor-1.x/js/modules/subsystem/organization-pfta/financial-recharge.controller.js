/**
 * financial-recharge.controller Created by zppro on 16-6-27.
 * Target:老人个人账户充值
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
        .controller('FinancialRechargeGridController', FinancialRechargeGridController)
        .controller('FinancialRechargeDetailsController', FinancialRechargeDetailsController)
    ;


    FinancialRechargeGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function FinancialRechargeGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});

            vm.booking = booking;

            vm.query();
        }

        function booking(row) {
            ngDialog.openConfirm({
                template: 'customConfirmDialog.html',
                className: 'ngdialog-theme-default',
                controller: ['$scope', function ($scopeConfirm) {
                    $scopeConfirm.message = 'confirm.BOOKING'
                }]
            }).then(function () {
                vmh.extensionService.bookingRecharge(row._id, {
                    operated_by: vm.operated_by,
                    operated_by_name: vm.operated_by_name
                }).then(function (ret) {
                    row.booking_flag = true;
                    vmh.alertSuccess('notification.BOOKING-SUCCESS',true);
                });
            });
        }
    }

    FinancialRechargeDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function FinancialRechargeDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;

        var redService = vm.modelNode.services['pub-red'];


        init();

        function init() {

            vm.init({removeDialog: ngDialog});

            vm.queryElderly = queryElderly;
            vm.selectElerly = selectElerly;
            vm.redRecharge = redRecharge;
            vm.disableRechargeAndUnbooking = disableRechargeAndUnbooking;
            vm.doSubmit = doSubmit;
            vm.tab1 = {cid: 'contentTab1'};

            vmh.parallel([
                vmh.shareService.d('D3005')
            ]).then(function (results) {
                vm.selectBinding.rechargeTypes = results[0];
            });

            vm.waiting = true;
            vm.rawRechargeAmount = 0;

            vm.load().then(function() {
                if(vm.model.elderlyId){
                    vm.selectedElderly = {_id: vm.model.elderlyId, name: vm.model.elderly_name};
                }
                if(vm.model._id) {
                    vmh.extensionService.checkCanChangeBookingOrUnbookingRecharge(vm.model._id).then(function (ret) {
                        console.log(ret);
                        vm.itCanDisableOrChange = ret.itCan;

                        refreshRededToRecharge();

                    }).catch(function(){
                        vm.elderlyDisabled = true;
                    }).finally(function(){
                        vm.waiting = false;
                    });

                }
                else{
                    vm.itCanDisableOrChange = true;
                    vm.waiting = false;
                }

                vm.rawRechargeAmount = vm.model.amount;

            });

        }

        function queryElderly(keyword) {
            return vmh.fetch(vmh.extensionService.queryElderly(vm.tenantId, keyword, {
                live_in_flag: true,
                begin_exit_flow: {'$in':[false,undefined]}
            }, 'name enter_code'));
        }

        function selectElerly(o) {
            if(o){
                vm.model.enter_code = o.originalObject.enter_code;
                vm.model.elderlyId = o.originalObject._id;
                vm.model.elderly_name = o.title;
            }
        }

        function refreshRededToRecharge() {
            redService.query({
                status: 1,
                voucher_no_to_red: vm.model.voucher_no,
                tenantId: vm.model.tenantId
            }).$promise.then(function (rows) {
                    vm.rededToRecharge = rows;
                    vm.rededToRecharge.length > 0 && (vm.hadRededToRecharge = true);
                });

        }

        function redRecharge(){
            ngDialog.open({
                template: 'do-red-for-recharge.html',
                controller: 'DialogDoRedController',
                className: 'ngdialog-theme-default ngdialog-do-red-for-recharge',
                data: {
                    vmh: vmh,
                    viewTranslatePathRoot: vm.viewTranslatePath(),
                    titleTranslatePath: vm.viewTranslatePath('DO-RED-FOR-RECHARGE'),
                    voucher_no_to_red: vm.model.voucher_no,
                    amount_booking: vm.model.amount,
                    tenantId: vm.tenantId,
                    operated_by: vm.operated_by,
                    operated_by_name: vm.operated_by_name
                }
            }).closePromise.then(function (ret) {
                    if(ret.value!='$document' && ret.value!='$closeButton' && ret.value!='$escape' ) {
                        refreshRededToRecharge();
                    }
                });
        }

        function disableRechargeAndUnbooking(){
            if(vm.model._id){
                ngDialog.openConfirm({
                    template: 'customConfirmDialog.html',
                    className: 'ngdialog-theme-default',
                    controller: ['$scope', function ($scopeConfirm) {
                        $scopeConfirm.message = vm.viewTranslatePath('DISABLE-RECHARGE-CONFIRM-MESSAGE')
                    }]
                }).then(function () {
                    vmh.extensionService.disableRechargeAndUnbooking(vm.model._id,{
                        operated_by: vm.operated_by,
                        operated_by_name: vm.operated_by_name
                    }).then(function (ret) {
                        vmh.alertSuccess('notification.DISABLE-RECHARGE-SUCCESS',true);
                        vm.toListView();
                    });
                });
            }
        }

        function doSubmit() {

            if ($scope.theForm.$valid) {
                vm.save(true).then(function(ret){
                    if(!vm.model.voucher_no){
                        return vmh.extensionService.bookingRecharge(vm.model._id || ret._id, {
                            operated_by: vm.operated_by,
                            operated_by_name: vm.operated_by_name
                        }).then(function () {
                            vmh.alertSuccess('notification.BOOKING-SUCCESS',true);
                            vm.returnBack();
                        });
                    }
                    else {
                        if (vm.rawRechargeAmount != vm.model.amount) {
                            vmh.extensionService.changeRechargeBookingAmount(vm.model._id,{
                                operated_by: vm.operated_by,
                                operated_by_name: vm.operated_by_name
                            }).then(function (ret) {
                                vmh.alertSuccess('notification.CHANGE-RECHARGE-BOOKING-AMOUNT-SUCCESS',true);
                                vm.returnBack();
                            });
                        }
                        else{
                            vm.returnBack();
                        }
                    }
                });
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
            }
        }


    }

})();