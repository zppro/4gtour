/**
 * district Created by zsx on 17-3-28.
 * Target:养老机构片区  (移植自fsrok)
 */

(function() {
    'use strict';
    
    angular
        .module('subsystem.pension-agency')
        .controller('DrugInstockGridController',DrugInstockGridController)
        .controller('DrugInstockDetailsController',DrugInstockDetailsController)
    ;

    DrugInstockGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function DrugInstockGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});
            vm.query();
        }
    }
     DrugInstockDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function DrugInstockDetailsController($scope, ngDialog, vmh, vm) {

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