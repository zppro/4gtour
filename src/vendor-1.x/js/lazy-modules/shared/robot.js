/**
 * district Created by zppro on 17-3-6.
 * Target:机器人
 */

(function() {
    'use strict';
    
    angular
        .module('subsystem.shared')
        .controller('RobotGridController', RobotGridController)
        .controller('RobotDetailsController', RobotDetailsController)
    ;


    RobotGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function RobotGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});
            vm.query();
        }
    }

    RobotDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function RobotDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;


        init();

        function init() {

            vm.init({removeDialog: ngDialog});


            vm.doSubmit = doSubmit;
            vm.tab1 = {cid: 'contentTab1'};

            vm.load().then(function(){
                vm.raw$stop_flag = !!vm.model.stop_flag;
            });

        }


        function doSubmit() {

            if ($scope.theForm.$valid) {
                var p;
                if(vm.raw$stop_flag === false && vm.model.stop_flag === true) {
                    p = vmh.fetch(vmh.psnService.robotRemoveRoomConfig(vm.tenantId, vm.model.id));
                } else {
                    p = vmh.promiseWrapper();
                }
                p.then(function(){
                    vm.save();
                });
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
            }
        }


    }

})();