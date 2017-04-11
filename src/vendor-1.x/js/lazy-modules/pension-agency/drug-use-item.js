/**
 * room Created by zsx on 17-4-7.
 * Target:养老机构工作项目
 */

(function() {
    'use strict';

    angular
        .module('subsystem.pension-agency')
        .controller('DrugUseItemGridController', DrugUseItemGridController)
        .controller('DrugUseItemDetailsController', DrugUseItemDetailsController);


    DrugUseItemGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function DrugUseItemGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({ removeDialog: ngDialog });
            vm.query();
        }
    }

    DrugUseItemDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function DrugUseItemDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;
        init();

        function init() {

            vm.init({ removeDialog: ngDialog });

            vm.doSubmit = doSubmit;
            vm.queryElderly = queryElderly;
            vm.selectElerly = selectElerly;
            vm.queryDrug = queryDrug;
            vm.selectDrug = selectDrug;

            vm.tab1 = { cid: 'contentTab1' };

            vmh.parallel([
                vmh.shareService.tmp('T3001/psn-nursingLevel', 'name', vm.treeFilterObject),
                vmh.shareService.d('D0103'),
                vmh.shareService.d('D0104')
            ]).then(function(results) {
                vm.selectBinding.nursingLevels = _.map(results[0], function(row) {
                    return { id: row._id, name: row.name }
                });
                vm.selectBinding.repeatTypes = results[1];
                vm.selectBinding.remindModes = results[2];
            });

            vm.load().then(function() {
                if (vm.model.repeat_values && vm.model.repeat_values.length > 0) {
                    vm.repeat_values = vm.model.repeat_values.join();
                }
                if(vm.model.elderlyId){
                    vm.selectedElderly = {_id: vm.model.elderlyId, name: vm.model.elderly_name};
                    vm.selectedDrug = {_id:vm.model.drugId,name:vm.model.name};
                }
            });
        }

        function queryElderly(keyword) {
            return vmh.fetch(vmh.psnService.queryElderly(vm.tenantId, keyword, {
                live_in_flag: true,
                // sbegin_exit_flow: {'$in':[false,undefined]}
            }, 'name'));
        }

        function selectElerly(o) {
            if (o) {
                // vm.model.enter_code = o.originalObject.enter_code;
                vm.model.elderlyId = o.originalObject._id;
                vm.model.elderly_name = o.originalObject.name;
            }
        }

        function queryDrug(keyword) {
            return vmh.fetch(vmh.psnService.queryDrug(vm.tenantId, keyword, {}, 'drug_no full_name'));
        }

        function selectDrug(o) {
            if (o) {
                vm.model.drugId = o.originalObject._id;
                vm.model.drug_no = o.originalObject.drug_no;
                vm.model.name = o.originalObject.full_name;
            }
        }

        function doSubmit() {
            var repeat_values = vm.repeat_values;
            if (repeat_values) {
                var arr = repeat_values.split(',');
                vm.model.repeat_values = repeat_values.split(',');
            }
            if ($scope.theForm.$valid) {

                vm.save();
            } else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
            }
        }
    }

})();
