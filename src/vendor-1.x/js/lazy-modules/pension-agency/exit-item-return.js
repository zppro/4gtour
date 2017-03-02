/**
 * material-exit-item-return.controller Created by zppro on 17-3-2.
 * Target:出院物品归还
 */
(function() {
    'use strict';

    angular
        .module('subsystem.pension-agency')
        .controller('ExitItemReturnGridController', ExitItemReturnGridController)
    ;


    ExitItemReturnGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function ExitItemReturnGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});

            vm.query();
        }

    }

})();