/**
 * district Created by zppro on 17-3-23.
 * Target:养老机构 护理级别
 */

(function() {
    'use strict';
    
    angular
        .module('subsystem.pension-agency')
        .controller('NursingLevelGridController', NursingLevelGridController)
        .controller('NursingLevelDetailsController', NursingLevelDetailsController)
    ;


    NursingLevelGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function NursingLevelGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});
            vm.query();
        }
    }

    NursingLevelDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function NursingLevelDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;


        init();

        function init() {

            vm.init({removeDialog: ngDialog});


            vm.doSubmit = doSubmit;
            vm.tab1 = {cid: 'contentTab1'};

            vmh.shareService.d('D3015').then(function (nursingAssessmentGrades) {
                vm.selectBinding.nursingAssessmentGrades = nursingAssessmentGrades;
            });

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