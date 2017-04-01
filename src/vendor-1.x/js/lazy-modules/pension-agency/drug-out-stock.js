/**
 *  Created by yrm on 17-3-31.
 */

(function() {
    'use strict';
    
    angular
        .module('subsystem.pension-agency')
        .controller('DrugOutStockGridController',DrugOutStockGridController)
        .controller('DrugOutStockDetailsController',DrugOutStockDetailsController)
    ;

    DrugOutStockGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function DrugOutStockGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});
            vm.drugOutStockInvalid = drugOutStockInvalid;
            vm.query();
        }

        function drugOutStockInvalid(o){
            console.log("==============================");
            console.log(o);
            vmh.psnService.drugOutStockInvalid(o);
        }
    }
    DrugOutStockDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function DrugOutStockDetailsController($scope, ngDialog, vmh, vm) {

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

            vm.typePromise = vmh.shareService.d('D3014').then(function (types) {
                vmh.utils.v.changeProperyName(types, [{o: 'value', n: '_id'}]);
                return types;
            });

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
                // vm.model.in_out_type = 0;
                // var nowDate = new Date();
                // vm.model.in_out_no = 'out-' + nowDate.toLocaleDateString() + '-' +  Math.floor(Math.random() * (9999 - 1000) + 1000);
                // vm.save(true).then(function(ret){
                //     vmh.psnService.drugOutStock(vm.tenantId,vm.model.elderlyId,vm.model.drugId,vm.model.in_out_quantity,vm.model.type,vm.model.unit).then(function(ret) {
                //             vmh.alertSuccess(vm.viewTranslatePath('SYNC_FAMILY_MEMBERS_SUCCESS'), true);
                //             vm.returnBack();
                //         });
                // })

                // vmh.psnService.drugOutStock(vm.tenantId,vm.model.elderlyId,vm.model.drugId,vm.model.in_out_quantity,vm.model.type,vm.model.unit).then(function(ret) {
                //             vmh.alertSuccess(vm.viewTranslatePath('SYNC_FAMILY_MEMBERS_SUCCESS'), true);
                //             vm.returnBack();
                //         });

                // function drugOutStock(){
                //     vmh.psnService.drugOutStock(vm.tenantId,vm.model.elderlyId,vm.model.drugId,vm.model.in_out_quantity,vm.model.type,vm.model.unit).then(function(ret) {
                //                                 vmh.alertSuccess(vm.viewTranslatePath('SYNC_FAMILY_MEMBERS_SUCCESS'), true);
                //                                 vm.returnBack();
                //                             });
                // }

                vmh.psnService.drugOutStock(vm.tenantId,vm.model.elderlyId,vm.model.drugId,vm.model.in_out_quantity,vm.model.type,vm.model.unit).then(function() {
                            vmh.alertSuccess(vm.viewTranslatePath('SYNC_FAMILY_MEMBERS_SUCCESS'), true);
                            vm.returnBack();
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