/**
 * district Created by zppro on 17-3-6.
 * Target:养老机构 模版
 */

(function() {
    'use strict';
    
    angular
        .module('subsystem.pension-agency')
        .controller('NursingPlanTemplateGridController', NursingPlanTemplateGridController)
        .controller('NursingPlanTemplateDetailsController', NursingPlanTemplateDetailsController)
    ;


    NursingPlanTemplateGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function NursingPlanTemplateGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});
            vm.query();
        }
    }

    NursingPlanTemplateDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function NursingPlanTemplateDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;


        init();

        function init() {

            vm.init({removeDialog: ngDialog});


            vm.doSubmit = doSubmit;
            vm.tab1 = {cid: 'contentTab1'};

            
            vm.dropdownDataPromise = vmh.clientData.getJson('subsystem').then(function (items) {
                console.log(items)
                vm.selectBinding.subsystems = _.where(items, {mtype: 'business'});
                if (vm.selectBinding.subsystems && vm.selectBinding.subsystems.length > 0) {
                    vmc.selectedSubsystem = vm.selectBinding.subsystems[0];
                    onSubsystemChanged();
                }
                return vm.selectBinding.subsystems
            });

            vm.load().then(function(){
                vm.raw$stop_flag = !!vm.model.stop_flag;
                //构造类型表格
                var x_axis = vm.model.type == 'A0001' ? 'weekAxis' :'monthAxis';
                vmh.clientData.getJson(x_axis).then(function (data) {
                    vm.xAxisData = data;
                });

                vm.yAxisDataPromise = vmh.shareService.tmp('T3009', null, {tenantId:vm.tenantId}).then(function(nodes){
                    console.log(nodes);
                    return nodes;
                });
            });

        }


        function doSubmit() {

            if ($scope.theForm.$valid) {
                var p;
                if(vm.raw$stop_flag === false && vm.model.stop_flag === true) {
                    p = vmh.fetch(vmh.psnService.nursingRobotRemoveRoomConfig(vm.tenantId, vm.model.id));
                } else {
                    p = vmh.promiseWrapper();
                }
                p.then(function(){
                    vm.save();
                });
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
            }
        }


    }

})();