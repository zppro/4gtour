/**
 * dialog-change-elderly-charge-item-for-other-and-customized.controller Created by zppro on 16-7-15.
 * Target:修改收费项目
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
        .controller('DialogChangeElderlyChargeItemForOtherAndCustomizedController', DialogChangeElderlyChargeItemForOtherAndCustomizedController)
    ;

    DialogChangeElderlyChargeItemForOtherAndCustomizedController.$inject = ['$scope','ngDialog','ORG_PFTA_CHARGE_ITEM'];

    function DialogChangeElderlyChargeItemForOtherAndCustomizedController($scope,ngDialog,ORG_PFTA_CHARGE_ITEM) {

        var vm = $scope.vm = {selectBinding:{}};
        var vmh = $scope.ngDialogData.vmh;

        $scope.utils = vmh.utils.v;

        init();

        function init() {
            vm.viewTranslatePathRoot = $scope.ngDialogData.viewTranslatePathRoot;
            vm.viewTranslatePath = function(key) {
                return vm.viewTranslatePathRoot + '.' + key;
            };
            vm.title = $scope.ngDialogData.titleTranslatePath;
            vm.tenantId = $scope.ngDialogData.tenantId;
            vm.elderlyId = $scope.ngDialogData.elderlyId;
            vm.charge_item_catalog_id = $scope.ngDialogData.charge_item_catalog_id;//other

            vm.isChanged = isChanged;
            vm.sumPeriodPrice = sumPeriodPrice;
            vm.isSelected = isSelected;
            vm.doSubmit = doSubmit;

            vmh.parallel([
                vmh.extensionService.elderlyInfo(vm.elderlyId, 'charge_standard,charge_items'),
                vmh.extensionService.tenantInfo(vm.tenantId, 'charge_standard,charge_items'),
                vmh.clientData.getJson('charge-item-organization-pfta'),
                vmh.extensionService.tenantChargeItemCustomizedAsTree(vm.tenantId),
                vmh.shareService.d('D1015')
            ]).then(function (results) {

                var charge_items_of_elderly = results[0].charge_items;
                var charge_items_of_tenant = results[1].charge_items;
                var selectedStandard = _.findWhere(results[2], {_id: results[0].charge_standard});
                if (selectedStandard) {

                    //将预订义收费标准模板替换为当前租户的收费标准
                    var selectedChargeItemCatalogs = _.where(selectedStandard.children, {_id: vm.charge_item_catalog_id});
                    //增加特色服务
                    if (results[3].children.length > 0) {
                        selectedChargeItemCatalogs.push(results[3]);
                    }
                    var selectionOfManualSelectable = {};
                    var rawSumedPeriodPrice = 0;
                    _.each(selectedChargeItemCatalogs, function (item) {
                        item.children = _.chain(item.children).map(function (o) {
                            var theChargeItem = _.findWhere(charge_items_of_elderly, {item_id: o._id});
                            var selected = true;
                            if (!theChargeItem) {
                                theChargeItem = _.findWhere(charge_items_of_tenant, {item_id: o._id});
                                selected = false;
                            }
                            if (o.data) {
                                theChargeItem = _.defaults(theChargeItem, {data: o.data});
                            }


                            if (theChargeItem.data.manual_seletable) {
                                selectionOfManualSelectable[theChargeItem.item_id] = selected;
                            }

                            if(selected) {
                                rawSumedPeriodPrice += theChargeItem.period_price;
                            }

                            return theChargeItem;
                        }).compact().value();

                    });


                    vm.selectedChargeItemCatalogs = selectedChargeItemCatalogs;
                    vm.selectionOfManualSelectable = selectionOfManualSelectable;
                    vm.rawSumedPeriodPrice = rawSumedPeriodPrice;

                    vm.raw_selectionOfManualSelectable = _.extend({}, selectionOfManualSelectable);

                    vm.period_map = {};
                    _.each(results[4], function (o) {
                        vm.period_map[o.value] = o.name;
                    });
                }
            });

            vm.selected_charge_item_object = {};
            vm.selectedChargeItem = {};
        }

        function isChanged(){
            var notChanged = true;
            for(var key in vm.selectionOfManualSelectable) {
                notChanged = notChanged && (vm.selectionOfManualSelectable[key] == vm.raw_selectionOfManualSelectable[key]);
            }
            return !notChanged;
        }

        function sumPeriodPrice() {
            var totals = 0;
            for (var item_id in vm.selectedChargeItem) {
                totals += vm.selectedChargeItem[item_id];
            }
            return totals;
        }

        function isSelected(charge_item) {
            var selected = vm.selectionOfManualSelectable[charge_item.item_id];
            if (selected) {
                vm.selectedChargeItem[charge_item.item_id] = charge_item.period_price;
                vm.selected_charge_item_object[charge_item.item_id] = charge_item;
            }
            else{
                delete vm.selectedChargeItem[charge_item.item_id];
                delete vm.selected_charge_item_object[charge_item.item_id];
            }
            return selected;
        }

        function doSubmit() {
            vm.authMsg = null;
            if ($scope.theForm.$valid) {
                if (isChanged()) {
                    var promise = ngDialog.openConfirm({
                        template: 'normalConfirmDialog.html',
                        className: 'ngdialog-theme-default'
                    }).then(function () {

                        //var selectedOtherAndCustomized = _.values(vm.selected_charge_item_object);
                        //$scope.closeThisDialog({otherAndCustomized:selectedOtherAndCustomized});

                        vmh.extensionService.changeElderlyChargeItemForOtherAndCustomized(
                            vm.tenantId,
                            vm.elderlyId,
                            vm.charge_item_catalog_id,
                            _.keys(vm.selected_charge_item_object)
                        ).then(function () {
                            console.log('invoked changeElderlyChargeItemForOtherAndCustomized');
                            $scope.closeThisDialog({otherAndCustomized:_.values(vm.selected_charge_item_object)});
                        }, function (err) {
                            vm.authMsg = err;
                        });
                    });
                }
                else {
                    console.log('NO-CHANGE');

                    return vmh.translate('notification.NO-CHANGE').then(function (ret) {
                        vm.authMsg = ret;
                    });
                }
            }
        }
    }

})();