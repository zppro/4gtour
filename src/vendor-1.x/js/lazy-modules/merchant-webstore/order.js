/**
 * Created by zppro on 17-1-9.
 * Target:web商城 订单
 */

(function() {
    'use strict';

    angular
        .module('subsystem.merchant-webstore.order',[])
        .controller('MWS_OrderGridController', MWS_OrderGridController)
        .controller('NWS_OrderDetailsController', NWS_OrderDetailsController)
    ;


    MWS_OrderGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function MWS_OrderGridController($scope, ngDialog, vmh, vm) {
        $scope.vm = vm;
        $scope.utils = vmh.utils.g; 

        init();

        function init() {
            vm.init({removeDialog: ngDialog});

            vm.shippingOrder = shippingOrder;
            vm.refuncForOrder = refuncForOrder;
               
            vm.query();
        }

        function shippingOrder(row) {
            ngDialog.openConfirm({
                template: 'customConfirmDialog.html',
                className: 'ngdialog-theme-default',
                controller: ['$scope', function ($scopeConfirm) {
                    $scopeConfirm.message = vm.viewTranslatePath('SUBMIT-PFT-CONFIRM-MESSAGE')
                }]
            }).then(function () {
                vm.blocker.start();
                console.log(row.id)
                vmh.idtService.PFT$issueTicket(row.id).then(function(ret){
                    row = _.extend(row, ret);
                    vmh.translate('notification.CUSTOM-SUCCESS',{customAction:"提交"}).then(function (msg) {
                        console.log(msg)
                        vmh.alertSuccess(msg);
                    })
                }).finally(function(){
                    vm.blocker.stop();
                });
            }); 
        }

        function refuncForOrder(row) {
            ngDialog.openConfirm({
                template: 'customConfirmDialog.html',
                className: 'ngdialog-theme-default',
                controller: ['$scope', function ($scopeConfirm) {
                    $scopeConfirm.message = vm.viewTranslatePath('REFUND-PFT-CONFIRM-MESSAGE')
                }]
            }).then(function () {
                vm.blocker.start();
                console.log(row.id)
                vmh.idtService.PFT$refundForTicket(row.id).then(function(ret){
                    row = _.extend(row, ret);
                    var customAction = row.UUrefund_audit == 0 ? '直接退款' : '申请退款';
                    vmh.translate('notification.CUSTOM-SUCCESS',{customAction: customAction}).then(function (msg) {
                        console.log(msg)
                        vmh.alertSuccess(msg);
                    })
                }).finally(function(){
                    vm.blocker.stop();
                });
            });
        }
    }

    NWS_OrderDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function NWS_OrderDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;


        init();

        function init() {

            vm.init({removeDialog: ngDialog});

            vm.doSubmit = doSubmit;
            vm.tab1 = {cid: 'contentTab1'};
            vm.tab2 = {cid: 'contentTab2',active:true};
            vm.load();

        }


        function doSubmit() {

            if ($scope.theForm.$valid) {
                vm.save();
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
                if ($scope.utils.vtab(vm.tab2.cid)) {
                    vm.tab2.active = true;
                }
            }
        }
    }
    
})();
