/**
 * Created by zppro on 16-3-22.
 */

(function() {
    'use strict';

    angular
        .module('subsystem.manage-center.order-receipt-confirmation',[])
        .controller('OrderReceiptConfirmationGridController', OrderReceiptConfirmationGridController)
    ;


    OrderReceiptConfirmationGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function OrderReceiptConfirmationGridController($scope, ngDialog, vmh, vm) {
        $scope.vm = vm;
        $scope.utils = vmh.utils.g;
        var vmc = $scope.vmc = {};


        init();


        function init() {

            vm.init({removeDialog: ngDialog});

            //处理树的分类节点适应查询
            vm.conditionBeforeQuery = function () {
                if($scope.$stateParams.tenantId && $scope.$stateParams.tenantId.length!=24) {
                    var node = vm.trees[0].findNodeById($scope.$stateParams.tenantId);
                    if(node) {
                        var tenantIds$in = node.children && _.map(node.children, function (o) {
                                return o._id;
                            });
                        vm.searchForm = _.extend(vm.searchForm, {tenantId: {$in: tenantIds$in}});
                    }
                }
            }

            if(vm.switches.leftTree) {
                vmh.shareService.tmg('T1005', 'name type').then(function (treeNodes) {
                    vm.trees = [new vmh.treeFactory.sTree('tree1', treeNodes)];
                    vm.trees[0].selectedNode = vm.trees[0].findNodeById($scope.$stateParams.tenantId);

                    vm.query();
                });

                $scope.$on('tree:node:select', function ($event, node) {
                    //console.log(tree.selectedNode);
                    var selectNodeId = node._id;

                    if ($scope.$stateParams.tenantId != selectNodeId) {
                        $scope.$state.go(vm.viewRoute(), {tenantId: selectNodeId});
                    }
                });
            }
            else{
                vm.query();
            }


            vmc.confirmOrderReceipt = confirmOrderReceipt;
        }

        function confirmOrderReceipt(row) {
            ngDialog.openConfirm({
                template: 'normalConfirmDialog.html',
                className: 'ngdialog-theme-default'
            }).then(function () {
                //A1001->A1002 订单状态从[等待客户付款]到[财务确认收款]
                var data = {order_status: 'A1003'};
                var promise = vm.modelService.update(row._id, data).$promise.then(function () {
                    row.order_status = data.order_status;
                });

                vmh.q.all([vmh.translate('notification.NORMAL-SUCCESS'), promise]).then(function (ret) {
                    vmh.notify.alert('<div class="text-center"><em class="fa fa-check"></em> ' + ret[0] + '</div>', 'success');
                });
            });
        }
    }


})();
