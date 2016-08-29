/**
 * dialog-change-elderly-room-info.controller Created by zppro on 16-6-2.
 * Target:修改房间床位
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
        .controller('DialogChangeElderlyRoomInfoController', DialogChangeElderlyRoomInfoController)
    ;

    DialogChangeElderlyRoomInfoController.$inject = ['$scope','ngDialog','ORG_PFTA_CHARGE_ITEM'];

    function DialogChangeElderlyRoomInfoController($scope,ngDialog,ORG_PFTA_CHARGE_ITEM) {

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
            vm.selected_charge_item =  $scope.ngDialogData.selectedItem;
            vm.room_info = angular.copy($scope.ngDialogData.selectedRoomInfo);

            vm.isDisabled = isDisabled;
            vm.getOccupyElderlyName = getOccupyElderlyName;
            vm.doSubmit = doSubmit;

            vmh.parallel([
                vmh.extensionService.tenantInfo(vm.tenantId, 'charge_standard,charge_items'),
                vmh.clientData.getJson('charge-item-organization-pfta'),
                vmh.shareService.tmp('T3003', 'name', {
                    tenantId: vm.tenantId,
                    floorSuffix: 'F',
                    bedNoSuffix: '#床'
                }),
                vmh.extensionService.roomStatusInfo(vm.tenantId)
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
                    var elderly_charge_item_catalog = _.findWhere(vm.selectedStandard.children, {_id: $scope.ngDialogData.charge_item_catalog_id});
                    if (elderly_charge_item_catalog) {
                        vm.elderly_charge_items = elderly_charge_item_catalog.children;
                    }
                }

                vm.treeData = results[2];
                vm.roomStatusInfo = {};
                _.each(results[3], function (roomStatus) {
                    _.each(roomStatus.occupied, function (occupy) {
                        if (occupy.elderlyId) {
                            vm.roomStatusInfo[roomStatus.roomId + '$' + occupy.bed_no] = {
                                elderly_name: occupy.elderlyId.name,
                                bed_status: occupy.bed_status
                            };
                        }
                    });
                });

            });

            $scope.$on('tree:node:select', function ($event, node, treeObject) {
                if (node.capacity) {
                    var arrIndex = node.attrs.index.split(treeObject.levelSplitChar);
                    var data = treeObject.treeData;
                    vm.room_summary = '';
                    for (var i = 0; i < arrIndex.length; i++) {
                        var currentNode = data[arrIndex[i]];
                        if (currentNode) {
                            vm.room_summary += currentNode.name;
                            if (currentNode.children) {
                                vm.room_summary += treeObject.levelSplitChar;
                                data = currentNode.children;
                            }
                        }
                    }

                    vm.roomCapacity = node.capacity;//房间类型选择
                    for(var i=0;i< vm.elderly_charge_items.length;i++){
                        var charge_item = vm.elderly_charge_items[i];
                        var selected = false;
                        //房间类型
                        if (angular.isArray(charge_item.data.capacity)) {
                            selected = _.contains(_.range(charge_item.data.capacity[0], charge_item.data.capacity[1]), vm.roomCapacity);
                        }
                        else {
                            selected = charge_item.data.capacity == vm.roomCapacity;
                        }

                        if(selected) {
                            vm.new_charge_item = charge_item;
                            break;
                        }
                    }

                }
            });
        }

        function isDisabled(node) {
            var key = node._id.split('$').slice(1).join('$');
            var bed_status = vm.roomStatusInfo[key] && vm.roomStatusInfo[key].bed_status;
            if (!bed_status)
                bed_status = 'A0001';//空闲
            return bed_status != 'A0001';
        }

        function getOccupyElderlyName(node) {
            var key = node._id.split('$').slice(1).join('$');
            var elderlyName = vm.roomStatusInfo[key] && vm.roomStatusInfo[key].elderly_name;
            return elderlyName;
        }


        function doSubmit() {
            vm.authMsg = null;
            if ($scope.theForm.$valid) {


                if ($scope.ngDialogData.selectedRoomInfo != vm.room_info) {
                    //var ret = {room_info: vm.room_info};
                    //var elArr = angular.element('.tree-node-cascade-selected');
                    //var room_summary = '';
                    //for(var i=0;i<elArr.length;i++) {
                    //    room_summary += angular.element(elArr[i]).text().replace(/\s*/gi, '') + '-';
                    //}
                    //var elderlyName = angular.element('.tree-node-selected .elderly-name').text();
                    //room_summary += angular.element('.tree-node-selected').text().replace(/\s*/gi, '').replace(elderlyName,'');
                    //ret.room_summary = room_summary;

                    var promise = ngDialog.openConfirm({
                        template: 'normalConfirmDialog.html',
                        className: 'ngdialog-theme-default'
                    }).then(function () {

                        var arrRoomInfo = vm.room_info.split('$');

                        vmh.extensionService.changeElderlyRoomBed(vm.tenantId, vm.elderlyId,arrRoomInfo[1],arrRoomInfo[2]).then(function(){
                            console.log('invoked changeElderlyRoomBed');
                            return vmh.extensionService.changeElderlyChargeItem(vm.tenantId, vm.elderlyId, vm.charge_item_catalog_id, vm.selected_charge_item.item_id, vm.new_charge_item).then(function(){
                                console.log('invoked changeElderlyChargeItem');
                            }).catch(function(err){
                                vm.authMsg = err;
                                vmh.notify.alert('<div class="text-center"><em class="fa fa-warning"></em> ' + err + '</div>', 'warning');
                            });
                        }).then(function(){
                            $scope.closeThisDialog({
                                room_charge_item: vm.new_charge_item,
                                room_info: vm.room_info,
                                room_summary: vm.room_summary
                            });
                        }).catch(function(err){
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