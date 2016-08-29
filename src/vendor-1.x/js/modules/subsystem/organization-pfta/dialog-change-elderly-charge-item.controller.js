/**
 * dialog-change-elderly-charge-item.controller Created by zppro on 16-6-2.
 * Target:修改收费项目
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
        .controller('DialogChangeElderlyChargeItemController', DialogChangeElderlyChargeItemController)
    ;

    DialogChangeElderlyChargeItemController.$inject = ['$scope','ngDialog','ORG_PFTA_CHARGE_ITEM'];

    function DialogChangeElderlyChargeItemController($scope,ngDialog,ORG_PFTA_CHARGE_ITEM) {

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
            vm.charge_item_catalog_id = $scope.ngDialogData.charge_item_catalog_id;
            vm.charge_item_id = $scope.ngDialogData.selectedItem.item_id;
            vm.selected_charge_item =  $scope.ngDialogData.selectedItem;


            vm.setChargeItem = setChargeItem;
            vm.doSubmit = doSubmit;

            vmh.parallel([
                vmh.extensionService.tenantInfo(vm.tenantId, 'charge_standard,charge_items'),
                vmh.clientData.getJson('charge-item-organization-pfta')
            ]).then(function (results) {

                var charge_items = results[0].charge_items;
                vm.selectedStandard = _.findWhere(results[1], {_id: results[0].charge_standard});
                if (vm.selectedStandard) {

                    //将预订义收费标准模板替换为当前租户的收费标准
                    _.each(vm.selectedStandard.children, function (item) {
                        item.children = _.chain(item.children).map(function (o) {
                            var theChargeItem = _.findWhere(charge_items, {item_id: o._id});
                            if (o.data) {
                                theChargeItem = _.defaults(theChargeItem, {data: o.data});
                            }
                            return theChargeItem;
                        }).compact().value();
                    });

                    //老人收费项目分类
                    var elderly_charge_item_catalog = _.findWhere(vm.selectedStandard.children, {_id: vm.charge_item_catalog_id});
                    if (elderly_charge_item_catalog) {
                        vm.selectBinding.elderly_charge_items = elderly_charge_item_catalog.children;
                    }

                }
            });
        }

        function setChargeItem(charge_item){
            vm.new_charge_item = charge_item;
        }

        function doSubmit() {
            vm.authMsg = null;
            if ($scope.theForm.$valid) {
                if ($scope.ngDialogData.selectedItem.item_id != vm.charge_item_id) {
                    var promise = ngDialog.openConfirm({
                        template: 'normalConfirmDialog.html',
                        className: 'ngdialog-theme-default'
                    }).then(function () {

                        vmh.extensionService.changeElderlyChargeItem(vm.tenantId, vm.elderlyId, vm.charge_item_catalog_id, vm.selected_charge_item.item_id, vm.new_charge_item).then(function () {
                            //修改elderly.charge_items中饮食套餐的收费项及饮食套餐描述
                            console.log('invoked changeElderlyChargeItem');
                            $scope.closeThisDialog(vm.new_charge_item);
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