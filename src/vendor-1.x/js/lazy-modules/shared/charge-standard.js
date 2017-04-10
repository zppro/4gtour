/**
 * ChargeStandard Created by zppro on 17-2-22.
 * Target:养老机构收费标准 (移植自fsrok)
 */
(function() {
    'use strict';

    angular
        .module('subsystem.shared')
        .controller('ChargeStandardController', ChargeStandardController)
    ;

    ChargeStandardController.$inject = ['$parse','$scope', 'PENSION_AGENCY_DEFAULT_CHARGE_STANDARD', 'vmh', 'instanceVM'];

    function ChargeStandardController($parse,$scope, PENSION_AGENCY_DEFAULT_CHARGE_STANDARD, vmh, vm) {
        $scope.vm = vm;
        var tenantService = vm.modelNode.services['pub-tenant'];

        init();


        function init() {

            vm.init();

            vm.chargeItems = {};
            vm.slider = {
                value: 0,
                options: {
                    floor: 0,
                    ceil: 9999
                }
            };

            vm.charges = {};

            vm.chargeItemDataPromise = vmh.clientData.getJson('charge-standards-pension-agency').then(function (items) {
                vm.selectBinding.standards = items;
                if (vm.selectBinding.standards.length > 0) {
                    return vmh.parallel([
                        vmh.extensionService.tenantChargeItemCustomizedAsTree(vm.model['tenantId'], PENSION_AGENCY_DEFAULT_CHARGE_STANDARD, vm._subsystem_),
                        
                        vmh.fetch(tenantService.query({_id: vm.model['tenantId']}, 'charge_standards')),
                        vmh.extensionService.tenantChargeItemNursingLevelAsTree(vm.model['tenantId'], PENSION_AGENCY_DEFAULT_CHARGE_STANDARD,vm._subsystem_)
                        
                    ]).then(function (results) {
                        console.log("==============00000000000000");
                        console.log(results);
                        var tenantChargeStandard = _.find(results[1][0].charge_standards, function(o){
                            console.log(o.subsystem )
                            console.log(vm._subsystem_)
                            return o.subsystem == vm._subsystem_
                        });
                        var selectedStandard;
                        if (tenantChargeStandard){
                            selectedStandard = _.find(vm.selectBinding.standards, function(o){
                                return o._id == tenantChargeStandard.charge_standard
                            });
                            vm.chargeItems = tenantChargeStandard.charge_items;
                        }

                        if (!selectedStandard) {
                            selectedStandard = vm.selectBinding.standards[0];
                        }

                        if (selectedStandard) {
                            vm.selectedStandardId = selectedStandard._id;
                        }

                        if(results[0].children.length>0) {
                            selectedStandard.children.push(results[0]);
                        }

                        if(results[2].children.length>0){
                            selectedStandard.children.push(results[2]);
                        }

                        setCheckedChargeItems();

                        return vmh.promiseWrapper(selectedStandard.children);
                    });
                }
            });

            vm.dropdownDataPromise = vmh.shareService.d('D1015');

            vm.onStandardChanged = onStandardChanged;
            vm.createChargeItem = createChargeItem;
            vm.saveChargeStandard = saveChargeStandard;

            function onStandardChanged() {
                var selectedStandard = _.findWhere(vm.selectBinding.standards, {_id: vm.selectedStandardId});
                if(selectedStandard){
                    vm.chargeItemDataPromise = vmh.promiseWrapper(selectedStandard.children);
                    setCheckedChargeItems();
                }
            }


            function setCheckedChargeItems(){
                vm.checkedChargeItems = _.map(vm.chargeItems,function(o){
                    o._id = o.item_id;
                    return o;
                });
                _.each(vm.checkedChargeItems,function(item) {
                    vm.charges[item.item_id] = {
                        item_id: item.item_id,
                        item_name: item.item_name,
                        period_price: item.period_price,
                        period: item.period
                    };
                });
            }


            function createChargeItem(node) {
                var theOne = vm.charges[node._id];
                if (!theOne) {
                    console.log(node);
                    vm.charges[node._id] = {
                        item_id: node._id,
                        item_name: node.name,
                        period_price: 0,
                        period: 'A0005'
                    }
                }
                //console.log(vm.charges);
            }

            function saveChargeStandard() {

                var checkedIds = _.map(vm.checkedChargeItems,function(o){return o._id});
                console.log(checkedIds);

                vm.saveCharges = _.filter(vm.charges,function(o){
                    return _.contains(checkedIds,o.item_id);
                });

                vmh.exec(vmh.extensionService.saveTenantChargeItemCustomized(vm.model['tenantId'], {
                    charge_standard: vm.selectedStandardId,
                    subsystem: vm._subsystem_,
                    charge_items: _.values(vm.saveCharges)
                }));
            }

        }
    }

})();