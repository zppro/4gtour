/**
 * Created by zppro on 17-1-9.
 * Target:web商城 售后
 */

(function() {
    'use strict';

    angular
        .module('subsystem.merchant-webstore')
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
                    var treeNodes = _.map(rows,function(row){
                        return {_id:row.value,name:row.name};
                    });
                    treeNodes.unshift({_id: '', name:'全部'});
                    vm.trees = [new vmh.treeFactory.sTree('tree1', treeNodes, {mode: 'grid'})];
                    vm.trees[0].selectedNode = vm.trees[0].findNodeById($scope.$stateParams.type);
                });

                $scope.$on('tree:node:select', function ($event, node) {
                    var selectNodeId = node._id;
                    if ($scope.$stateParams.type != selectNodeId) {
                        $scope.$state.go(vm.viewRoute(), {type: selectNodeId});
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
            vm.tab1 = {cid: 'contentTab1', active: true};


            vmh.shareService.d('MWS07').then(function (rows) {
                vm.selectBinding.afterSaleAuditResults = rows;
            });

            vm.load().then(function(){
                if (vm._action_ == 'accept' && vm.model.biz_status == 'A0001') {
                    vmh.mwsService.afterSaleAccept(vm.model.id).then(function(ret){
                        vm.model.biz_status = ret.biz_status;
                        vm.model.audit_on = ret.audit_on;
                    });
                }
            });

        }

        function doSubmit() {
            if ($scope.theForm.$valid) {
                if (vm.finish_flag) {
                    ngDialog.openConfirm({
                        template: 'customConfirmDialog.html',
                        className: 'ngdialog-theme-default',
                        controller: ['$scope', function ($scopeConfirm) {
                            $scopeConfirm.message = vm.viewTranslatePath('SUBMIT-FINISH-CONFIRM-MESSAGE')
                        }]
                    }).then(function () {
                        vm.model.biz_status = 'A0005';
                        vm.save();
                    });
                } else {
                    vm.save();
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
