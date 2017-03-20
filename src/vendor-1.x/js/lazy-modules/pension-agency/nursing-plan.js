/**
 * district Created by zppro on 17-3-17.
 * Target:养老机构 模版计划
 */

(function() {
    'use strict';
    
    angular
        .module('subsystem.pension-agency')
        .controller('NursingPlanController', NursingPlanController)
    ;

    NursingPlanController.$inject = ['$scope', 'ngDialog', 'vmh', 'instanceVM'];

    function NursingPlanController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;

        init();

        function init() {

            vm.init({removeDialog: ngDialog});
 
            vm.onRoomChange = onRoomChange;

            vm.tab1 = {cid: 'contentTab1'};

            vmh.clientData.getJson('nursingPlanAxis').then(function (data) {
                vm.xAxisData = data;
            });

            vm.yAxisDataPromise = vmh.shareService.tmp('T3009', null, {tenantId:vm.tenantId}).then(function(nodes){
                console.log('yAxisDataPromise');
                console.log(nodes);
                return nodes;
            });

            fetchNursingPlan();
        }


        function fetchNursingPlan() {
            console.log('parse nursingPlanItems:');
            vmh.psnService.nursingPlansByRoom(vm.tenantId, ['name', 'sex', 'nursing_assessment_level'], ['assessment_level_current', 'service_items', 'remark']).then(function(data){
                vm.aggrData = data;
                console.log(vm.aggrData);
            });
        }
        
        function onRoomChange () {
            console.log('onRoomChange');
            var yAxisDataFlatten = [];
            _.each(vm.yAxisData, function (o) {
                for (var i = 1, len = o.capacity; i <= len; i++) {
                    yAxisDataFlatten.push(_.extend({trackedKey: o._id + '$' + i, bed_no: i}, o));
                }
            });
            vm.yAxisDataFlatten = yAxisDataFlatten;
        }
    }
})();