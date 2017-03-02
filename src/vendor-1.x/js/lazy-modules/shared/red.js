/**
 * red Created by zppro on 17-3-2.
 * Target:冲红明细
 */

(function() {
    'use strict';

    angular
        .module('subsystem.shared')
        .controller('RedGridController', RedGridController)
        .controller('RedDetailsController', RedDetailsController)
    ;


    RedGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function RedGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});

            vm.query();
        }
    }

    RedDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function RedDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v; 
        
        init();

        function init() {

            vm.init({removeDialog: ngDialog});

            vm.queryVoucherNo = queryVoucherNo;
            vm.selectVoucherNo = selectVoucherNo;
            vm.disableRechargeAndUnbooking = disableRechargeAndUnbooking;
            vm.doSubmit = doSubmit;
            vm.tab1 = {cid: 'contentTab1'};

            //vmh.parallel([
            //    vmh.shareService.d('D3005')
            //]).then(function (results) {
            //    vm.selectBinding.rechargeTypes = results[0];
            //});

            vm.waiting = true;
            vm.rawRedAmount = 0;

            vm.load().then(function() {
                if(vm.model.voucher_no_to_red){
                    vm.selectedVoucherNo = {voucher_no: vm.model.voucher_no_to_red};
                    vmh.fetch(vmh.extensionService.queryVoucherNo(vm.tenantId, 'psn_recharge', vm.model.voucher_no_to_red,  {}, 'voucher_no amount')).then(function(rows) {
                        console.log(rows[0]);
                        if(rows.length>0) {
                            vm.raw_amount = rows[0].amount;
                        }
                    });

                }
                if(vm.model._id) {
                    vmh.psnService.checkCanChangeBookingOrUnbookingRedToElderlyRecharge(vm.model._id).then(function (ret) {
                        console.log(ret);
                        vm.itCanDisableOrChange = ret.itCan;
                    }).finally(function(){
                        vm.waiting = false;
                    });
                }
                else{
                    vm.itCanDisableOrChange = true;
                    vm.waiting = false;
                }

                vm.rawRedAmount = vm.model.amount;
            });

        }

        function queryVoucherNo(keyword) {
            return vmh.fetch(vmh.extensionService.queryVoucherNo(vm.tenantId, 'psn_recharge',  keyword,  {carry_over_flag: true}, 'voucher_no amount'));
        }


        function selectVoucherNo(o) {
            if(o){

                var voucher_no_to_red = o.originalObject.voucher_no;
                //判断能否冲红
                vmh.psnService.checkCanBookingRedToElderlyRecharge({
                    voucher_no_to_red: voucher_no_to_red,
                    tenantId: vm.tenantId
                }).then(function(ret){
                    console.log(ret);
                    if(ret.itCan) {
                        vm.model.voucher_no_to_red = voucher_no_to_red;
                        vm.raw_amount = o.originalObject.amount;
                        vm.isSystemInnerBooking = ret.isSystemInnerBooking;
                    }
                });
            }
        }

        function disableRechargeAndUnbooking(){
            if(vm.model._id){
                ngDialog.openConfirm({
                    template: 'customConfirmDialog.html',
                    className: 'ngdialog-theme-default',
                    controller: ['$scope', function ($scopeConfirm) {
                        $scopeConfirm.message = vm.viewTranslatePath('DISABLE-RED-CONFIRM-MESSAGE')
                    }]
                }).then(function () {
                    vmh.psnService.disableRedAndUnbookingToElderlyRecharge(vm.model._id,{
                        operated_by: vm.operated_by,
                        operated_by_name: vm.operated_by_name
                    }).then(function (ret) {
                        vmh.alertSuccess('notification.DISABLE-RED-SUCCESS',true);
                        vm.toListView();
                    });
                });
            }
        }

        function doSubmit() {

            if ($scope.theForm.$valid) {

                if(!vm.model.voucher_no) {
                    //添加
                    if (vm.model.voucher_no_to_red) {
                        return vmh.psnService.bookingRedToElderlyRecharge({
                            voucher_no_to_red: vm.model.voucher_no_to_red,
                            isSystemInnerBooking: vm.isSystemInnerBooking,
                            amount: vm.model.amount,
                            tenantId: vm.tenantId,
                            operated_by: vm.operated_by,
                            operated_by_name: vm.operated_by_name
                        }).then(function () {
                            vmh.alertSuccess('notification.RED-SUCCESS', true);
                            vm.returnBack();
                        });
                    }
                    else{
                        vmh.alertWarning(vm.viewTranslatePath('INVALID-VOUCHER_NO-TO-RED'),true);
                    }
                }
                else {
                    //修改
                    vm.save(true).then(function(ret){
                        if (vm.rawRedAmount != vm.model.amount) {
                            vmh.extensionService.changeRedBookingAmountToElderlyRecharge(vm.model._id,{
                                operated_by: vm.operated_by,
                                operated_by_name: vm.operated_by_name
                            }).then(function (ret) {
                                vmh.alertSuccess('notification.CHANGE-RED-BOOKING-AMOUNT-SUCCESS',true);
                                vm.returnBack();
                            });
                        }
                        else{
                            vm.returnBack();
                        }
                    });
                }
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
            }
        }


    }

})();