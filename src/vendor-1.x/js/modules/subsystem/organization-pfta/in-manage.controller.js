/**
 * in-manage.controller Created by zppro on 16-5-31.
 * Target:老人在院管理
 */
(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
        .controller('InManageGridController', InManageGridController)
        .controller('InManageDetailsController', InManageDetailsController)
    ;


    InManageGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function InManageGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});

            vm.query();
        }

    }

    InManageDetailsController.$inject = ['$scope','ngDialog','ORG_PFTA_CHARGE_ITEM', 'vmh', 'entityVM'];

    function InManageDetailsController($scope,ngDialog,ORG_PFTA_CHARGE_ITEM, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;

        var roomOccupancyChangeHistoryService = vm.modelNode.services['pfta-roomOccupancyChangeHistory'];

        init();

        function init() {

            vm.init({removeDialog: ngDialog});

            vm.serverSideCheck = serverSideCheck;
            vm.sumPeriodPrice = sumPeriodPrice;
            vm.addElderlyFamilyMember = addElderlyFamilyMember;
            vm.editElderlyFamilyMember = editElderlyFamilyMember;
            vm.saveElderlyFamilyMember = saveElderlyFamilyMember;
            vm.cancelElderlyFamilyMember = cancelElderlyFamilyMember;
            vm.removeElderlyFamilyMember = removeElderlyFamilyMember;
            vm.checkElderlyFamilyMemberAll = checkElderlyFamilyMemberAll;
            vm.refreshRoomOccupancyChangeHistory = refreshRoomOccupancyChangeHistory;
            vm.refreshJournalAccount = refreshJournalAccount;
            vm.submitApplicationToExit = submitApplicationToExit;
            vm.doSubmit = doSubmit;
            vm.changeBoard = changeBoard;
            vm.changeNursing = changeNursing;
            vm.changeRoom = changeRoom;
            vm.changeOtherAndCustomized = changeOtherAndCustomized;


            vm.tab1 = {cid: 'contentTab1'};
            vm.tab2 = {cid: 'contentTab2'};

            vmh.parallel([
                vmh.shareService.d('D1006'),
                vmh.shareService.d('D1007'),
                vmh.shareService.d('D1008'),
                vmh.shareService.d('D1009'),
                vmh.shareService.d('D1010'),
                vmh.shareService.d('D1011'),
                vmh.shareService.d('D1012'),
                vmh.shareService.d('D1015'),
                vmh.shareService.d('D3002')
            ]).then(function (results) {
                vm.selectBinding.sex = results[0];
                vm.selectBinding.marriages = results[1];
                vm.selectBinding.medical_insurances = results[2];
                vm.selectBinding.politics_statuses = results[3];
                vm.selectBinding.inhabit_statuses = results[4];
                vm.selectBinding.financial_statuses = results[5];
                vm.selectBinding.relationsWithTheElderly = results[6];
                vm.period_map = {};
                _.each(results[7], function (o) {
                    vm.period_map[o.value] = o.name;
                });
                vm.selectBinding.revenue_and_expenditure_types = results[8];
            });


            vm.hobbiesPromise = vmh.shareService.d('D1013').then(function (hobbies) {
                vmh.utils.v.changeProperyName(hobbies, [{o: 'value', n: '_id'}]);
                return hobbies;
            });

            vm.medical_historiesPromise = vmh.shareService.d('D1014').then(function (medical_histories) {
                vmh.utils.v.changeProperyName(medical_histories, [{o: 'value', n: '_id'}]);
                return medical_histories;
            });

            vm.selectBinding.periodValues = _.range(1, 7);
            vm.load().then(function() {
                vm.addSubGrid('journal_account', {
                    model: vmh.q.when(vm.model.journal_account)
                }).then(function (grid) {
                    grid.query();
                });

                vm.refreshRoomOccupancyChangeHistory();


                var selectedBoard = _.find(vm.model.charge_items, function (item) {
                    return item.item_id.indexOf((ORG_PFTA_CHARGE_ITEM.BOARD + '-' + vm.model.charge_standard).toLowerCase()) != -1;
                });
                selectedBoard && (vm.selectedBoard = angular.copy(selectedBoard));

                var selectedNursing = _.find(vm.model.charge_items, function (item) {
                    return item.item_id.indexOf((ORG_PFTA_CHARGE_ITEM.NURSING + '-' + vm.model.charge_standard).toLowerCase()) != -1;
                });
                selectedNursing && (vm.selectedNursing = angular.copy(selectedNursing));

                var selectedRoom = _.find(vm.model.charge_items, function (item) {
                    return item.item_id.indexOf((ORG_PFTA_CHARGE_ITEM.ROOM + '-' + vm.model.charge_standard).toLowerCase()) != -1;
                });
                selectedRoom && (vm.selectedRoom = angular.copy(selectedRoom));

                vm.selectedRoomInfo = vm.model.room_value.districtId + '$' + vm.model.room_value.roomId + '$' + vm.model.room_value.bed_no;


                //独立成方法单独调用
                vm.selectedOtherAndCustomized = _.filter(vm.model.charge_items, function (item) {
                    return item.item_id.indexOf((ORG_PFTA_CHARGE_ITEM.OTHER + '-' + vm.model.charge_standard).toLowerCase()) != -1 ||
                        item.item_id.indexOf((ORG_PFTA_CHARGE_ITEM.CUSTOMIZED + '-' + vm.model.charge_standard).toLowerCase()) != -1
                        ;
                });
                setOtherAndCustomized();

            });



            //vm.subGrid.journal_account.order = {};
        }



        function serverSideCheck(id_no) {
            if ((vm._action_ == 'add' && vm._id_ == 'new' && id_no.length == 18)
                || vm._action == 'edit' && vm.elderlyModel.id_no != id_no) {
                return vmh.q(function (resolve, reject) {
                    return vmh.extensionService.checkBeforeAddEnter(id_no, vm.model.tenantId).then(function (ret) {
                        if (ret.elderly) {
                            if(vm._action_ == 'add'){
                                vm.elderlyModel = ret.elderly;
                                vm.model.elderlyId = vm.elderlyModel._id;
                            }
                            else {
                                _.defaults(vm.elderlyModel,ret.elderly);
                            }
                        }
                        resolve();
                    }, function (err) {
                        vm.CheckBeforeAddEnterError = err;
                        reject();
                    });
                });
            }
            return true;
        };

        function sumPeriodPrice() {
            var totals = 0;
            if(vm.model.charge_items) {
                for (var i = 0; i < vm.model.charge_items.length; i++) {
                    totals += vm.model.charge_items[i].period_price;
                }
            }

            return totals;
        }

        function addElderlyFamilyMember() {
            if (!vm.$gridEditingOfElderlyFamilyMember) {
                vm.model.family_members.push({sex: 'N', isNew: true, $editing: true})
                vm.$gridEditingOfElderlyFamilyMember = true;
            }
        }

        function editElderlyFamilyMember(row) {
            vm.editingRow = angular.copy(row);
            row.$editing = true;
            vm.$gridEditingOfElderlyFamilyMember = true;
        }

        function saveElderlyFamilyMember(row) {
            if(row.isNew) {
                row.isNew = false;
            }
            else{
                vm.editingRow = null;
            }
            row.$editing = false;
            vm.$gridEditingOfElderlyFamilyMember = false;
        }

        function cancelElderlyFamilyMember(row) {
            if(row.isNew) {
                vm.model.family_members.splice(vm.model.family_members.length - 1, 1);
            }
            else {
                _.extend(row, vm.editingRow);
            }
            row.$editing = false;
            vm.$gridEditingOfElderlyFamilyMember = false;
        }

        function removeElderlyFamilyMember() {
            var haveSelected = _.some(vm.model.family_members, function (row) {
                return row.checked
            });
            if (!haveSelected) {

                return vmh.translate('notification.SELECT-NONE-WARNING').then(function (ret) {
                    vmh.notify.alert('<div class="text-center"><em class="fa fa-warning"></em> ' + ret + '</div>', 'warning');
                });
            }

            ngDialog.openConfirm({
                template: 'removeConfirmDialog.html',
                className: 'ngdialog-theme-default'
            }).then(function () {
                for(var i=0;i<vm.model.family_members.length;i++) {
                    var row = vm.model.family_members[i];
                    if (row.checked) {
                        vm.model.family_members.splice(i, 1);
                        i--;
                    }
                }
            });
        }

        function checkElderlyFamilyMemberAll($event) {
            var rowCheckState = true;
            if ($event.target.tagName == "INPUT" && $event.target.type == "checkbox") {
                var $checkbox = angular.element($event.target);
                rowCheckState = $checkbox.prop('checked');
            }

            for(var i=0;i<vm.model.family_members.length;i++) {
                vm.model.family_members[i].checked = rowCheckState;
            }
        }

        function refreshRoomOccupancyChangeHistory() {
            //vm.elderlyRoomOccupancyChangeHistoryRows = roomOccupancyChangeHistoryService.query({
            //    elderlyId: vm.model._id,
            //    tenantId: vm.model.tenantId
            //});
            //vm.elderlyRoomOccupancyChangeHistoryRows.$promise.then(function(rows) {
            //    console.log(rows);
            //});
            roomOccupancyChangeHistoryService.query({
                elderlyId: vm.model._id,
                tenantId: vm.model.tenantId
            }).$promise.then(function (rows) {
                    vm.elderlyRoomOccupancyChangeHistoryRows = rows;
                });

        }

        function refreshJournalAccount(){
            vmh.extensionService.elderlyInfo(vm.model._id,'charge_items,subsidiary_ledger,journal_account').then(function(ret){
                vm.model.charge_items = ret.charge_items;
                vm.model.subsidiary_ledger = ret.subsidiary_ledger;
                vm.model.journal_account = ret.journal_account;
                vm.subGrid['journal_account'].setData(vm.model.journal_account);
                vm.subGrid['journal_account'].query();
            });
        }

        function setOtherAndCustomized(){

            if(vm.selectedOtherAndCustomized.length>0){
                var keys = _.map(vm.selectedOtherAndCustomized,function(o){
                    return o.item_id;
                });

                var pairs = {};
                _.each(vm.selectedOtherAndCustomized,function(o){
                    pairs[o.item_id] = o.item_name;
                });

                //合并名称
                vmh.translate(keys).then(function (ret) {
                    var vals = [];
                    for(var v in ret){
                        if(ret[v] ==  v) {
                            vals.push(pairs[v]);
                        }
                        else{
                            vals.push(ret[v]);
                        }
                    }
                    vm.other_and_customized = vals.join();
                });
            }
            else {
                vmh.translate(["label.NONE"]).then(function (ret) {
                    vm.other_and_customized = ret['label.NONE'];
                });
            }

        }

        function submitApplicationToExit() {
            ngDialog.openConfirm({
                template: 'customConfirmDialog.html',
                className: 'ngdialog-theme-default',
                controller: ['$scope', function ($scopeConfirm) {
                    $scopeConfirm.message = vm.viewTranslatePath('EXIT-CONFIRM-MESSAGE')
                }]
            }).then(function () {
                vmh.extensionService.submitApplicationToExit(vm.model._id, {
                    operated_by: vm.operated_by,
                    operated_by_name: vm.operated_by_name
                }).then(function (ret) {
                    vm.model.begin_exit_flow = ret.begin_exit_flow;
                    vmh.alertSuccess();
                });
            });
        }

        function doSubmit() {
            if ($scope.theForm.$valid) {
                vm.save();
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
                else if ($scope.utils.vtab(vm.tab2.cid)) {
                    vm.tab2.active = true;
                }
            }
        }

        function changeBoard() {

            ngDialog.open({
                template: 'change-elderly-charge-item.html',
                controller: 'DialogChangeElderlyChargeItemController',
                data: {
                    vmh: vmh,
                    viewTranslatePathRoot:vm.viewTranslatePath(),
                    titleTranslatePath: vm.viewTranslatePath('TAB1-BOARD-INFO'),
                    tenantId: vm.model.tenantId,
                    elderlyId: vm.model._id,
                    charge_item_catalog_id: ORG_PFTA_CHARGE_ITEM.BOARD + '-' + vm.model.charge_standard,
                    selectedItem: vm.selectedBoard
                }
            }).closePromise.then(function (ret) {
                    if(ret.value!='$document' && ret.value!='$closeButton' && ret.value!='$escape' ) {
                        console.log(ret.value);
                        vm.selectedBoard = ret.value;
                        vm.model.board_summary = vm.selectedBoard.item_name;
                        vm.refreshJournalAccount();
                    }
                });
        }

        function changeNursing() {

            ngDialog.open({
                template: 'change-elderly-charge-item.html',
                controller: 'DialogChangeElderlyChargeItemController',
                data: {
                    vmh: vmh,
                    viewTranslatePathRoot:vm.viewTranslatePath(),
                    titleTranslatePath: vm.viewTranslatePath('TAB1-NURSING-INFO'),
                    tenantId: vm.model.tenantId,
                    elderlyId: vm.model._id,
                    charge_item_catalog_id: ORG_PFTA_CHARGE_ITEM.NURSING + '-' + vm.model.charge_standard,
                    selectedItem: vm.selectedNursing
                }
            }).closePromise.then(function (ret) {
                    if(ret.value!='$document' && ret.value!='$closeButton' && ret.value!='$escape' ) {
                        console.log(ret);
                        vm.selectedNursing = ret.value;
                        vm.model.nursing_summary = vm.selectedNursing.item_name;
                        vm.refreshJournalAccount();
                    }
                });
        }

        function changeRoom() {
            ngDialog.open({
                template: 'change-elderly-room-info.html',
                controller: 'DialogChangeElderlyRoomInfoController',
                className: 'ngdialog-theme-default ngdialog-change-elderly-room-info',
                data: {
                    vmh: vmh,
                    viewTranslatePathRoot:vm.viewTranslatePath(),
                    titleTranslatePath: vm.viewTranslatePath('TAB1-ROOM-INFO'),
                    tenantId: vm.model.tenantId,
                    elderlyId: vm.model._id,
                    charge_item_catalog_id: ORG_PFTA_CHARGE_ITEM.ROOM + '-' + vm.model.charge_standard,
                    selectedItem: vm.selectedRoom,
                    selectedRoomInfo: vm.selectedRoomInfo
                }
            }).closePromise.then(function (ret) {
                    console.log(ret);
                    if (ret.value != '$document' && ret.value != '$closeButton' && ret.value != '$escape') {
                        vm.selectedRoom = ret.value.room_charge_item;
                        vm.selectedRoomInfo = ret.value.room_info;
                        vm.model.room_summary = ret.value.room_summary;
                        vm.refreshJournalAccount();
                        vm.refreshRoomOccupancyChangeHistory();
                    }
                });
        }

        function changeOtherAndCustomized(){
            ngDialog.open({
                template: 'change-elderly-charge-item-for-other-and-customized.html',
                controller: 'DialogChangeElderlyChargeItemForOtherAndCustomizedController',
                className: 'ngdialog-theme-default ngdialog-change-elderly-charge-item-for-other-and-customized',
                data: {
                    vmh: vmh,
                    viewTranslatePathRoot:vm.viewTranslatePath(),
                    titleTranslatePath: vm.viewTranslatePath('TAB1-OTHER-AND-CUSTOMIZED-INFO'),
                    tenantId: vm.model.tenantId,
                    elderlyId: vm.model._id,
                    charge_item_catalog_id: ORG_PFTA_CHARGE_ITEM.OTHER + '-' + vm.model.charge_standard
                }
            }).closePromise.then(function (ret) {
                    console.log(ret);
                    if (ret.value != '$document' && ret.value != '$closeButton' && ret.value != '$escape') {

                        vm.selectedOtherAndCustomized = ret.value.otherAndCustomized;
                        setOtherAndCustomized();
                        vm.refreshJournalAccount();
                    }
                });
        }
    }

})();