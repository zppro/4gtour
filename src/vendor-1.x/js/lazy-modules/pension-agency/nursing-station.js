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

            vm.elderlys = _.range(80);
        }

        function onFloorChange () {
            console.log('onFloorChange:',vm.floorData);
            vm.nursingStationBlocker.start();
            vmh.timeout(function(){
                vm.nursingStationBlocker.stop();
            },5000);
            // var yAxisDataFlatten = [];
            // _.each(vm.yAxisData, function (o) {
            //     for (var i = 1, len = o.capacity; i <= len; i++) {
            //         var trackedKey =  o._id + '$' + i;
            //         yAxisDataFlatten.push(_.extend({trackedKey: trackedKey, bed_no: i}, o));
            //     }
            // });
            // vm.yAxisDataFlatten = yAxisDataFlatten;
            // console.log('yAxisDataFlatten:',vm.yAxisDataFlatten);
        }

    }
})();