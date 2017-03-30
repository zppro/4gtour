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

    NursingStationController.$inject = ['$scope', 'ngDialog', 'blockUI', 'vmh', 'instanceVM'];

    function NursingStationController($scope, ngDialog, blockUI, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;

        init();

        function init() {

            vm.init({removeDialog: ngDialog});

            vm.onFloorChange = onFloorChange;
            
            vm.nursingStationBlocker = blockUI.instances.get('nursing-station');

            vm.floorDataPromise = vmh.shareService.tmp('T3008', null, {tenantId:vm.tenantId}).then(function(nodes){
                console.log(nodes);
                return nodes;
            });
            
            vm.elderlyStatusMonitor = {};

        }

        function onFloorChange () {
            console.log('onFloorChange:',vm.floorData);
            if (vm.floorData.length > 0) {
                vm.nursingStationBlocker.start();
                vmh.psnService.elderlysByDistrictFloors(vm.tenantId, _.map(vm.floorData,function(o){
                    return o._id;
                })).then(function(data){
                    vm.elderlys = data;
                }).finally(function(){
                    vm.nursingStationBlocker.stop();
                });
            } else {
                vm.elderlys = [];
            }
        }

    }
})();