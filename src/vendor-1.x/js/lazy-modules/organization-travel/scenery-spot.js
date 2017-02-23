/**
 * Created by zppro on 16-11-21.
 * Target:社交 景点
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-travel')
        .controller('ScenerySpotGridController', ScenerySpotGridController)
        .controller('ScenerySpotDetailsController', ScenerySpotDetailsController)
    ;
    
    ScenerySpotGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function ScenerySpotGridController($scope, ngDialog, vmh, vm) {
        $scope.vm = vm;
        $scope.utils = vmh.utils.g; 

        init();
        
        function init() {
            vm.init({removeDialog: ngDialog});


            // vmh.translate(vm.viewTranslatePath('RESET-USER-PASSWORD-COMMENT')).then(function (ret) {
            //     $scope.dialogData = {details: ret};
            // });
            vm.query();
        }
    }

    ScenerySpotDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function ScenerySpotDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;


        init();

        function init() {

            vm.init({removeDialog: ngDialog});

            vm.doSubmit = doSubmit;
            vm.tab1 = {cid: 'contentTab1',active:true};
            vm.tab2 = {cid: 'contentTab2'};

            vm.treeDataPromise = vmh.shareService.t('district').then(function(nodes){
                vm.load();
                return nodes;
            });

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
