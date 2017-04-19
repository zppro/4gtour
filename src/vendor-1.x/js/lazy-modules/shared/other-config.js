/**
 * Created by yrm on 17-4-13.
 * Target:其它配置
 */
(function() {
    'use strict';
    
    angular
        .module('subsystem.shared')
        .controller('Shared_OtherConfigGridController', Shared_OtherConfigGridController)
    ;


    Shared_OtherConfigGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'instanceVM'];

    function Shared_OtherConfigGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;
        var tenantService = vm.modelNode.services['pub-tenant'];

        init();

        function init() {
            vm.init({removeDialog: ngDialog});
            vm.doSubmit = doSubmit;
            vmh.fetch(tenantService.query({_id: vm.tenantId})).then(function(results){
                vm.other_configs = results[0].other_config;
                console.log(vm.other_configs.psn_bed_monitor_timeout);
                console.log(vm.tenantId);
            });

        }

        function doSubmit(){
            if ($scope.theForm.$valid) {
                
                console.log(vm.other_configs.psn_bed_monitor_timeout);

                vmh.exec(vmh.extensionService.saveTenantOtherConfig(vm.model['tenantId'], vm.other_configs.psn_bed_monitor_timeout));
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
            }
        }
    }

})();