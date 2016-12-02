/**
 * Created by zppro on 16-12-2.
 */

(function() {
    'use strict';

    angular
        .module('subsystem.manage-center.app-serverside-update',[])
        .controller('AppServerSideUpdateDetailsController', AppServerSideUpdateDetailsController)
    ;

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


        function doSubmit() {

            if ($scope.theForm.$valid) {
                //console.log(vm.model);
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
