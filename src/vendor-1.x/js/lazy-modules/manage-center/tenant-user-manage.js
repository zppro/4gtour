/**
 * Created by zppro on 16-3-22.
 */

(function() {
    'use strict';

    angular
        .module('subsystem.manage-center')
        .controller('TenantUserManageGridController', TenantUserManageGridController)
        .controller('TenantUserManageDetailsController', TenantUserManageDetailsController)
    ;


    TenantUserManageGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function TenantUserManageGridController($scope, ngDialog, vmh, vm) {
        $scope.vm = vm;
        $scope.utils = vmh.utils.g;
        var vmc = $scope.vmc = {};

        init();


        function init() {



            //console.log(vm._subsystem_);
            //console.log(vm._module_);d
            //console.log(vm._view_);
            //console.log(vm._action_);
            vm.init({removeDialog: ngDialog});

            vmc.resetUserPassword = resetUserPassword;
            //if($scope.$stateParams.tenantId) {
            //    vm.searchForm.tenantId = $scope.$stateParams.tenantId;
            //}
            //else {
            //    vm.searchForm.tenantId = {$exists: true};
            //}
            //console.log(vm.treeFilterObject);
            if (vm.switches.leftTree) {
                vmh.shareService.tmp('T3001/pub-tenant', 'name type', vm.treeFilterObject).then(function (treeNodes) {
                    vm.trees = [new vmh.treeFactory.sTree('tree1', treeNodes, {mode: 'grid'})];
                    vm.trees[0].selectedNode = vm.trees[0].findNodeById($scope.$stateParams.tenantId);
                });

                $scope.$on('tree:node:select', function ($event, node) {
                    //console.log(tree.selectedNode);
                    var selectNodeId = node._id;
                    if ($scope.$stateParams.tenantId != selectNodeId) {
                        $scope.$state.go(vm.viewRoute(), {tenantId: selectNodeId});

                    }
                });
            }

            vmh.translate(vm.viewTranslatePath('RESET-USER-PASSWORD-COMMENT')).then(function (ret) {
                $scope.dialogData = {details: ret};
            });

            vm.query();
        }

        function resetUserPassword(userId) {
            ngDialog.openConfirm({
                template: 'normalConfirmDialog.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            }).then(function () {

                vmh.q.all([vmh.translate('notification.NORMAL-SUCCESS'), vmh.extensionService.resetUserPassword(userId)]).then(function (ret) {
                    vmh.notify.alert('<div class="text-center"><em class="fa fa-check"></em> ' + ret[0] + '</div>', 'success');
                });
            });
        }
    }

    TenantUserManageDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function TenantUserManageDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;


        init();

        function init() {

            vm.init({removeDialog: ngDialog});

            if (vm.selectFilterObject.tenants) {
                vm.selectBinding.tenants = vm.modelNode.services['pub-tenant'].query(vm.selectFilterObject.tenants, '_id name');
            }
            vmh.shareService.d('D1001').then(function (rows) {
                if(vm.model.type!='A0001') {
                    //非平台用户管理时角色不能选超级管理员
                    rows = _.initial(rows);
                }
                vm.selectBinding.roles = rows;
            });

            vm.doSubmit = doSubmit;
            vm.tab1 = {cid: 'contentTab1'};
            //vm.tab2 = {cid: 'contentTab2'};

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

                //else if ($scope.utils.vtab(vm.tab2.cid)) {
                //    vm.tab2.active = true;
                //}
            }
        }


    }

})();
