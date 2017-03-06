/**
 * district Created by zppro on 17-3-6.
 * Target:养老机构 护工
 */

(function() {
    'use strict';
    
    angular
        .module('subsystem.pension-agency')
        .controller('NursingRobotGridController', NursingRobotGridController)
        .controller('NursingRobotDetailsController', NursingRobotDetailsController)
    ;


    NursingRobotGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function NursingRobotGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});
            vm.query();
        }
    }

    NursingRobotDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function NursingRobotDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;


        init();

        function init() {

            vm.init({removeDialog: ngDialog});


            vm.doSubmit = doSubmit;
            vm.tab1 = {cid: 'contentTab1'};

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
            }
        }


    }

})();