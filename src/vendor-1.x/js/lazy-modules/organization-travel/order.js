/**
 * Created by zppro on 16-9-21.
 * Target:票付通接口数据 订单
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-travel')
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
            vm.refuncForOrder = refuncForOrder;
            vm.refreshOrder = refreshOrder;
            vm.resendSmsForOrder = resendSmsForOrder;

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

        function submitOrder(row) {
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

        function refreshOrder(row) {
            vm.blocker.start();
            vmh.idtService.PFT$refreshOrderInfo(row.id).then(function(ret){
                row = _.extend(row, ret);
                vmh.translate('notification.CUSTOM-SUCCESS',{customAction:"刷新"}).then(function (msg) {
                    console.log(msg)
                    vmh.alertSuccess(msg);
                })
            }).finally(function(){
                vm.blocker.stop();
            });
        }

        function resendSmsForOrder(row) {
            ngDialog.openConfirm({
                template: 'customConfirmDialog.html',
                className: 'ngdialog-theme-default',
                controller: ['$scope', function ($scopeConfirm) {
                    $scopeConfirm.message = vm.viewTranslatePath('RESEND-SMS-PFT-CONFIRM-MESSAGE')
                }]
            }).then(function () {
                vm.blocker.start();

                vmh.idtService.PFT$resendSmsForOrder(row.id).then(function(ret){
                    row = _.extend(row, ret);
                    vmh.translate('notification.CUSTOM-SUCCESS',{customAction: '重发订单短信'}).then(function (msg) {
                        vmh.alertSuccess(msg);
                    })
                }).finally(function(){
                    vm.blocker.stop();
                });
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
