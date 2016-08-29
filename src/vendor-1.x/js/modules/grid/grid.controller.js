/**=========================================================
 * Module: grid.controller.js
 * Handle grid elements
 =========================================================*/

(function() {
    'use strict';

    angular
        .module('app.grid')
        .controller('GridController', GridController)
    ;

    GridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];
    function GridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();


        function init() {

            //console.log(vm._subsystem_);
            //console.log(vm._module_);d
            //console.log(vm._view_);
            //console.log(vm._action_);
            vm.init({removeDialog: ngDialog});
            vm.query();
        }
    }


})();
