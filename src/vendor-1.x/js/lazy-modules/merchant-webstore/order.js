/**
 * Created by zppro on 17-1-9.
 * Target:web商城 订单
 */

(function() {
    'use strict';

    angular
        .module('subsystem.merchant-webstore')
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
               
            vm.query();
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
            vm.tab2 = {cid: 'contentTab2'};

            if (vm._action_ == 'ship') {
                vm.tab2.active = true;
            } else {
                vm.tab1.active = true;
            }

            vm.load();

        }


        function doSubmit() {
            if ($scope.theForm.$valid) {
                if (vm._action_ == 'ship') {
                    ngDialog.openConfirm({
                        template: 'customConfirmDialog.html',
                        className: 'ngdialog-theme-default',
                        controller: ['$scope', function ($scopeConfirm) {
                            $scopeConfirm.message = vm.viewTranslatePath('SUBMIT-SHIPPING-CONFIRM-MESSAGE')
                        }]
                    }).then(function () {
                        vm.blocker.start();
                        vmh.mwsService.orderShip(vm.model.id, {shipping_fee: vm.model.shipping_fee, logistics_code: vm.model.logistics_code, logistics_company: vm.model.logistics_company}).then(function(ret){
                            vmh.translate('notification.CUSTOM-SUCCESS',{customAction: '发货'}).then(function (msg) {
                                vmh.alertSuccess(msg);
                            })
                            vm.toListView();
                        }).finally(function(){
                            vm.blocker.stop();
                        });
                    });
                } else {
                    vm.save();
                }
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
