/**
 * Created by yrm on 17-4-13.
 * Target:其它配置
 */
(function() {
    'use strict';
    
    angular
        .module('subsystem.shared')
        .controller('Shared_OtherConfigGridController', Shared_OtherConfigGridController)
        .controller('Shared_OtherConfigDetailsController', Shared_OtherConfigDetailsController)
    ;


    Shared_OtherConfigGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function Shared_OtherConfigGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;
        var tenantService = vm.modelNode.services['pub-tenant'];
        var other_configs = {};

        init();

        function init() {
            vm.init({removeDialog: ngDialog});
            vmh.fetch(tenantService.query({_id: vm.tenantId})).then(function(results){
                other_configs['other_config'] = results[0].other_config;
                // other_configs['_id'] = results[0]._id;
                vm.other_configs = other_configs;
                console.log(vm.other_configs);
                console.log(vm.tenantId);
            });
        }
    }

    Shared_OtherConfigDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function Shared_OtherConfigDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;
        var tenantService = vm.modelNode.services['pub-tenant'];

        init();

        function init() {

            vm.init({removeDialog: ngDialog});
            vmh.fetch(tenantService.query({_id: vm.tenantId})).then(function(results){
                vm.psn_bed_monitor_timeout = results[0].other_config.psn_bed_monitor_timeout;
        });

            vm.doSubmit = doSubmit;
            vm.tab1 = {cid: 'contentTab1'};

            vm.load();

        }


        function doSubmit() {
            console.log(vm.psn_bed_monitor_timeout);
            if ($scope.theForm.$valid) {
                vm.model.other_config.psn_bed_monitor_timeout = vm.psn_bed_monitor_timeout;
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