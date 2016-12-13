/**
 * Created by zppro on 16-12-2.
 */

(function() {
    'use strict';

    angular
        .module('subsystem.manage-center.app-serverside-update',[])
        .controller('AppServerSideUpdateGridController', AppServerSideUpdateGridController)
        .controller('AppServerSideUpdateDetailsController', AppServerSideUpdateDetailsController)
    ;

    AppServerSideUpdateGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function AppServerSideUpdateGridController($scope, ngDialog, vmh, vm) {
        $scope.vm = vm;
        $scope.utils = vmh.utils.g;
        var vmc = $scope.vmc = {};

        init();


        function init() {
            vm.init({removeDialog: ngDialog});

            vm.upgrade = upgrade;

            vm.query();
        }

        function upgrade() {
            ngDialog.openConfirm({
                template: 'normalConfirmDialog.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            }).then(function () {
                vmh.extensionService.upgradeAppServerSide('A0001').then(function(){
                    vm.query();
                    vmh.alertSuccess('notification.NORMAL-SUCCESS', true);
                })
            });
        }
    }
    
    AppServerSideUpdateDetailsController.$inject = ['$scope','ngDialog', 'vmh','entityVM'];

    function AppServerSideUpdateDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});

            vm.doSubmit = doSubmit;
            vm.tab1 = {cid: 'contentTab1'};

            vmh.shareService.d('D0102').then(function (rows) {
                vm.selectBinding.apps = rows;
            });

            vm.load();

        }

        function genVerOrder(ver) {
            var arr = ver.split('.');
            return parseInt(arr[0]) * 10000 + parseInt(arr[1]) * 100 + parseInt(arr[2]);
        }

        function doSubmit() {

            if ($scope.theForm.$valid) {
                //console.log(vm.model);
                vm.model.ver_order = genVerOrder(vm.model.ver);
                vm.save();
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
            }
        }
    }

})();
