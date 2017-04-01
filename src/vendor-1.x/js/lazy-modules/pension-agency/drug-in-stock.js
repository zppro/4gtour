/**
 * district Created by zsx on 17-3-28.
 * Target:养老机构片区  (移植自fsrok)
 */

(function() {
    'use strict';
    
    angular
        .module('subsystem.pension-agency')
        .controller('DrugInstockGridController',DrugInstockGridController)
        .controller('DrugInstockDetailsController',DrugInstockDetailsController)
    ;

    DrugInstockGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function DrugInstockGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});
            vm.query();
        }
    }
    DrugInstockDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function DrugInstockDetailsController($scope, ngDialog, vmh, vm) {

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

            vm.typePromise = vmh.shareService.d('D3014').then(function (hobbies) {
                vmh.utils.v.changeProperyName(hobbies, [{o: 'value', n: '_id'}]);
                return hobbies;
            });

            vm.load().then(function(){
                if(vm.model.elderlyId){
                    vm.selectedElderly = {_id: vm.model.elderlyId, name: vm.model.elderly_name};

                    vm.selectedDrug = {_id:vm.model.drugId,full_name:vm.model.drug_full_name};
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
            console.log(o);
            if(o){
                // vm.model.enter_code = o.originalObject.enter_code;
                vm.model.elderlyId = o.originalObject._id;
                vm.model.elderly_name = o.originalObject.name;
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
                vm.model.in_out_no= "IN-"+new Date().toLocaleDateString()+"-"+(Math.floor(Math.random()*8999)+1000);
                vm.save(true).then(function(ret){
                    vmh.psnService.drugInStock(vm.tenantId,vm.model.elderlyId,vm.model.elderly_name,vm.model.drugId,vm.model.drug_no,vm.model.drug_full_name,vm.model.in_out_quantity,vm.model.type,vm.model.unit).then(function(ret) {
                            vmh.alertSuccess(vm.viewTranslatePath('SYNC_FAMILY_MEMBERS_SUCCESS'), true);
                            vm.returnBack();
                        });
                })
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
            }
        }


    }

})();