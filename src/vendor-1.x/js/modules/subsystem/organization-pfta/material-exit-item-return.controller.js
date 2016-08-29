/**
 * material-exit-item-return.controller Created by zppro on 16-6-20.
 * Target:出院物品归还
 */
(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
        .controller('MaterialExitItemReturnGridController', MaterialExitItemReturnGridController)
    ;


    MaterialExitItemReturnGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function MaterialExitItemReturnGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});

            vm.query();
        }

    }

})();