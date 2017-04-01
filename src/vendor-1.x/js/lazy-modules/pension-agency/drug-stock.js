// Created by yrm on 17-3-28.
(function() {
    'use strict';
    
    angular
        .module('subsystem.pension-agency')
        .controller('DrugStockGridController',DrugStockGridController)
        .controller('DrugStockDetailsController',DrugStockDetailsController)
    ;

    DrugStockGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function  DrugStockGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});
            vm.query();
        }
    }
    DrugStockDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function  DrugStockDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;


        init();

        function init() {

            vm.init({removeDialog: ngDialog});
            vm.doSubmit = doSubmit;
            vm.queryElderly = queryElderly;
            vm.selectElerly = selectElerly;
            vm.queryDrug = queryDrug;
            vm.selectDrug = selectDrug;
            vm.tab1 = {cid: 'contentTab1'};
            
            vmh.parallel([
                vmh.shareService.d('D3013'),
            ]).then(function(results){
                vm.selectBinding.unit = results[0];
            })   

            vm.load().then(function(){
                if(vm.model.elderlyId){
                    vm.selectedElderly = {_id: vm.model.elderlyId, name: vm.model.elderly_name};
                    vm.selectedDrug = {_id:vm.model.drugId,drug_no:vm.model.drug_no};
                }
            });


        }

        function queryElderly(keyword) {
            console.log('keyword', keyword)
            return vmh.fetch(vmh.psnService.queryElderly(vm.tenantId, keyword, {
                  live_in_flag: true,
                  // sbegin_exit_flow: {'$in':[false,undefined]}
            }, 'name'));
        }

        function selectElerly(o) {
            if(o){
                // vm.model.enter_code = o.originalObject.enter_code;
                vm.model.elderlyId = o.originalObject._id;
                vm.model.elderly_name = o.title;
            }
        }
         
        function queryDrug(keyword) {
            return vmh.fetch(vmh.psnService.queryDrug(vm.tenantId, keyword, {}, 'drug_no full_name'));
        }

        function selectDrug(o) {
            console.log(o);
            if(o){
                vm.model.drugId = o.originalObject._id;
                vm.model.drug_no = o.originalObject.drug_no;
                vm.model.drug_full_name = o.originalObject.full_name;
            }
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