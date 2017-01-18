/**
 * Created by zppro on 17-1-9.
 * Target:web商城 售后
 */

(function() {
    'use strict';

    angular
        .module('subsystem.merchant-webstore.after-sale',[])
        .controller('MWS_AfterSaleGridController', MWS_AfterSaleGridController)
        .controller('NWS_AfterSaleDetailsController', NWS_AfterSaleDetailsController)
    ;


    MWS_AfterSaleGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function MWS_AfterSaleGridController($scope, ngDialog, vmh, vm) {
        $scope.vm = vm;
        $scope.utils = vmh.utils.g; 

        init();

        function init() {
            vm.init({removeDialog: ngDialog});

            if (vm.switches.leftTree) {
                vmh.shareService.d('MWS06').then(function (rows) {
                    var treeNodes = _.map(_.initial(rows),function(row){
                        return {_id:row.value,name:row.name};
                    });
                    treeNodes.unshift({_id: '', name:'全部'});
                    vm.trees = [new vmh.treeFactory.sTree('tree1', treeNodes, {mode: 'grid'})];
                    vm.trees[0].selectedNode = vm.trees[0].findNodeById($scope.$stateParams.roles);
                });

                $scope.$on('tree:node:select', function ($event, node) {

                    var selectNodeId = node._id;
                    if ($scope.$stateParams.roles != selectNodeId) {
                        $scope.$state.go(vm.viewRoute(), {roles: selectNodeId});
                    }
                });
            }

            vm.query();
        }
    }

    NWS_AfterSaleDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function NWS_AfterSaleDetailsController($scope, ngDialog, vmh, vm) {

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
                        vmh.mwsService.ship(vm.model.id, {shipping_fee: vm.model.shipping_fee, logistics_code: vm.model.logistics_code, logistics_company: vm.model.logistics_company}).then(function(ret){
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
