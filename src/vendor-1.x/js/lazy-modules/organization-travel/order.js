/**
 * Created by zppro on 16-9-21.
 * Target:票付通接口数据 订单
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-travel.order',[])
        .controller('PFT_OrderGridController', PFT_OrderGridController)
        .controller('PFT_OrderDetailsController', PFT_OrderDetailsController)
    ;


    PFT_OrderGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function PFT_OrderGridController($scope, ngDialog, vmh, vm) {
        $scope.vm = vm;
        $scope.utils = vmh.utils.g; 

        init();

        function init() {
            vm.init({removeDialog: ngDialog});

            vm.submitOrder = submitOrder;

            if (vm.switches.leftTree) {
                vm.searchForm['scenicSpotId'] = undefined;
                vm.treeFilterObject['tenantId'] = undefined;
                vm.UUid = $scope.$stateParams.scenicSpotId;
                console.log(vm.UUid);
                vm.treeDataPromise = vmh.shareService.tmp('T3001/idc-scenicSpot_PFT', 'UUid show_name name', vm.treeFilterObject);

                $scope.$on('tree:node:select', function ($event, node) {

                    vm.UUid = vm.searchForm['UUlid'] = node.UUid;
                    console.log(vm.UUid);
                    vm.query();
                });
            }
            vm.searchForm['tenantId'] = undefined;
            vm.query();
        }

        function submitOrder(scenicSpotId) {

            ngDialog.openConfirm({
                template: 'customConfirmDialog.html',
                className: 'ngdialog-theme-default',
                controller: ['$scope', function ($scopeConfirm) {
                    $scopeConfirm.message = vm.viewTranslatePath('SUBMIT-PFT-CONFIRM-MESSAGE')
                }]
            }).then(function () {
                //...
            }); 
        }
    }

    PFT_OrderDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function PFT_OrderDetailsController($scope, ngDialog, vmh, vm) {

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
