/**
 * district Created by zppro on 17-3-29.
 * Target:养老机构 护士台
 */

(function() {
    'use strict';
    
    angular
        .module('subsystem.pension-agency')
        .controller('NursingStationController', NursingStationController)
    ;

    NursingStationController.$inject = ['$scope', 'ngDialog', 'vmh', 'instanceVM'];

    function NursingStationController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;

        init();

        function init() {

            vm.init({removeDialog: ngDialog});
        }

    }
})();