
/**
 * exit Created by zppro on 17-3-2.
 * Target:老人出院管理  (移植自fsrok)
 */
(function() {
    'use strict';

    angular
        .module('subsystem.pension-agency')
        .controller('ExitGridController', ExitGridController)
        .controller('ExitDetailsController', ExitDetailsController)
    ;


    ExitGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function ExitGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});

            vm.completeExit = completeExit;

            vm.query();
        }

        function completeExit(row){
            ngDialog.openConfirm({
                template: 'customConfirmDialog.html',
                className: 'ngdialog-theme-default',
                controller: ['$scope', function ($scopeConfirm) {
                    $scopeConfirm.message = vm.viewTranslatePath('COMPLETE-EXIT-CONFIRM-MESSAGE')
                }]
            }).then(function () {
                vmh.extensionService.completeExit(row._id, {
                    operated_by: vm.operated_by,
                    operated_by_name: vm.operated_by_name
                }).then(function (ret) {
                    row.current_step = ret.current_step;
                    row.exit_on = ret.exit_on;
                    vmh.alertSuccess();
                });
            });
        }
    }

    ExitDetailsController.$inject = ['$scope', 'ngDialog', 'PENSION_AGENCY_CHARGE_ITEM', 'vmh', 'entityVM'];

    function ExitDetailsController($scope, ngDialog, PENSION_AGENCY_CHARGE_ITEM, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;

        init();

        function init() {

            vm.init({removeDialog: ngDialog});


            vm.submitToAuditItemReturn = submitToAuditItemReturn;
            vm.submitToAuditSettlement = submitToAuditSettlement;
            vm.submitToConfirmExit = submitToConfirmExit;
            vm.completeExit = completeExit;
            vm.doSubmit = doSubmit;
            vm.exitSettlement = exitSettlement;
            vm.chargeList = chargeList;

            vm.tab1 = {cid: 'contentTab1'};
            vm.tab2 = {cid: 'contentTab2'};
            vm.tab3 = {cid: 'contentTab3'};


            vmh.parallel([
                vmh.shareService.d('D1006'),
                vmh.shareService.d('D1012')
            ]).then(function (results) {
                vm.selectBinding.sex = results[0];
                vm.selectBinding.relationsWithTheElderly = results[1];
                vm.selectBinding.pass_flag_options = [{
                    name: 'button.AUDIT-TRUE',
                    value: true
                }, {name: 'button.AUDIT-FALSE', value: false}];
            });

            vm.currentStepReadonly = true;

            vm.load().then(function () {

                vm.currentStepReadonly = vm.model.current_step != 'A0001';
                vm.all_flow_audit = _.compact(_.union(vm.model.pre_flow_audit, [
                    _.defaults(vm.model.item_return_audit, {name: PENSION_AGENCY_CHARGE_ITEM.EXIT$ITEM_RETURN, readonly: true}),
                    _.defaults(vm.model.settlement_audit, {name: PENSION_AGENCY_CHARGE_ITEM.EXIT$SETTLEMENT, readonly: true})
                ]));

                if (vm.model.current_step == 'A0001' && vm.model.agent_info && vm.model.agent_info.name && vm.model.agent_info.id_no && vm.model.agent_info.relation_with && vm.model.agent_info.phone) {
                    vm.submit_source = 'ToAuditItemReturn';
                }

                if (vm.model.current_step == 'A0003' && !vm.model.item_return_audit) {
                    vm.model.item_return_audit = {pass_flag: false};
                }
                if (vm.model.current_step == 'A0005' && !vm.model.settlement_audit) {
                    vm.model.settlement_audit = {pass_flag: false};
                }

                //vm.addSubGrid('journal_account', {

                //    sortColumn: 'check_in_time',
                //    model: vmh.q.when(vm.model.journal_account)
                //}).then(function (grid) {
                //    grid.query();
                //});
                //
                //vm.refreshRoomOccupancyChangeHistory();
                //
                //
                //var selectedBoard = _.find(vm.model.charge_items, function (item) {
                //    return item.item_id.indexOf((PENSION_AGENCY_CHARGE_ITEM.BOARD + '-' + vm.model.charge_standard).toLowerCase()) != -1;
                //});
                //selectedBoard && (vm.selectedBoard = angular.copy(selectedBoard));
                //
                //var selectedNursing = _.find(vm.model.charge_items, function (item) {
                //    return item.item_id.indexOf((PENSION_AGENCY_CHARGE_ITEM.NURSING + '-' + vm.model.charge_standard).toLowerCase()) != -1;
                //});
                //selectedNursing && (vm.selectedNursing = angular.copy(selectedNursing));
                //
                //var selectedRoom = _.find(vm.model.charge_items, function (item) {
                //    return item.item_id.indexOf((PENSION_AGENCY_CHARGE_ITEM.ROOM + '-' + vm.model.charge_standard).toLowerCase()) != -1;
                //});
                //selectedRoom && (vm.selectedRoom = angular.copy(selectedRoom));
                //
                //vm.selectedRoomInfo = vm.model.room_value.districtId + '$' + vm.model.room_value.roomId + '$' + vm.model.room_value.bed_no;

            });


            //vm.subGrid.journal_account.order = {};
        }


        function submitToAuditItemReturn() {

            ngDialog.openConfirm({
                template: 'customConfirmDialog.html',
                className: 'ngdialog-theme-default',
                controller: ['$scope', function ($scopeConfirm) {
                    $scopeConfirm.message = vm.viewTranslatePath('TO-AUDIT-ITEM_RETURN-CONFIRM-MESSAGE')
                }]
            }).then(function () {
                vmh.extensionService.submitToAuditItemReturn(vm.model._id).then(function () {
                    vmh.alertSuccess();
                    vm.returnBack();
                });
            });

        }

        function submitToAuditSettlement() {
            ngDialog.openConfirm({
                template: 'customConfirmDialog.html',
                className: 'ngdialog-theme-default',
                controller: ['$scope', function ($scopeConfirm) {
                    $scopeConfirm.message = vm.viewTranslatePath('TO-AUDIT-SETTLEMENT-CONFIRM-MESSAGE')
                }]
            }).then(function () {
                vmh.extensionService.submitToAuditSettlement(vm.model._id, {
                    operated_by: vm.operated_by,
                    operated_by_name: vm.operated_by_name,
                    comment: vm.model.item_return_audit.comment
                }).then(function (ret) {
                    vmh.alertSuccess();
                    vm.returnBack();
                });
            });
        }

        function submitToConfirmExit() {

            if(!vm.model.settlement_info || !vm.model.settlement_info.settlement_flag) {
                vmh.alertWarning(vm.viewTranslatePath('TO-CONFIRM-EXIT-WITHOUT-SETTLEMENT-WARNING'), true);
                return;
            }

            ngDialog.openConfirm({
                template: 'customConfirmDialog.html',
                className: 'ngdialog-theme-default',
                controller: ['$scope', function ($scopeConfirm) {
                    $scopeConfirm.message = vm.viewTranslatePath('TO-CONFIRM-EXIT-CONFIRM-MESSAGE')
                }]
            }).then(function () {
                vmh.extensionService.submitToConfirmExit(vm.model._id, {
                    operated_by: vm.operated_by,
                    operated_by_name: vm.operated_by_name,
                    comment: vm.model.settlement_audit.comment
                }).then(function (ret) {
                    vmh.alertSuccess();
                    vm.returnBack();
                });
            });
        }

        function completeExit(){
            ngDialog.openConfirm({
                template: 'customConfirmDialog.html',
                className: 'ngdialog-theme-default',
                controller: ['$scope', function ($scopeConfirm) {
                    $scopeConfirm.message = vm.viewTranslatePath('TO-COMPLETE-EXIT-CONFIRM-MESSAGE')
                }]
            }).then(function () {
                vmh.extensionService.completeExit(vm.model._id, {
                    operated_by: vm.operated_by,
                    operated_by_name: vm.operated_by_name
                }).then(function (ret) {
                    vm.model.current_step = ret.current_step;
                    vm.model.exit_on = ret.exit_on;
                    vmh.alertSuccess();
                });
            });
        }

        function doSubmit() {
            if ($scope.theForm.$valid) {

                if (vm.model.current_step == 'A0003' && vm.model.item_return_audit.pass_flag == false) {
                    if (!vm.model.item_return_audit.operated_by) {
                        vm.model.item_return_audit.operated_by = vm.operated_by;
                    }
                    if (!vm.model.item_return_audit.operated_by_name) {
                        vm.model.item_return_audit.operated_by_name = vm.operated_by_name;
                    }
                }

                if (vm.model.current_step == 'A0005' && vm.model.settlement_audit.pass_flag == false) {
                    if (!vm.model.settlement_audit.operated_by) {
                        vm.model.settlement_audit.operated_by = vm.operated_by;
                    }
                    if (!vm.model.settlement_audit.operated_by_name) {
                        vm.model.settlement_audit.operated_by_name = vm.operated_by_name;
                    }
                }

                if (vm.submit_source == 'ToAuditItemReturn') {
                    vm.submitToAuditItemReturn();
                }
                else {
                    vm.save();
                }

            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
                else if ($scope.utils.vtab(vm.tab2.cid)) {
                    vm.tab2.active = true;
                }
                else if ($scope.utils.vtab(vm.tab3.cid)) {
                    vm.tab3.active = true;
                }
            }
        }

        function exitSettlement() {

            ngDialog.open({
                template: 'exit-settlement.html',
                controller: 'DialogExitSettlementController',
                className: 'ngdialog-theme-default ngdialog-exit-settlement',
                data: {
                    vmh: vmh,
                    viewTranslatePathRoot: vm.viewTranslatePath(),
                    titleTranslatePath: vm.viewTranslatePath('EXIT-SETTLEMENT'),
                    exitId: vm.model._id,
                    elderlyId: vm.model.elderlyId,
                    operated_by: vm.operated_by,
                    operated_by_name: vm.operated_by_name
                }
            }).closePromise.then(function (ret) {
                if(ret.value!='$document' && ret.value!='$closeButton' && ret.value!='$escape' ) {
                    vm.model.settlement_info.settlement_flag = ret.value.settlement_flag;
                    vm.model.settlement_info.advance_payment_amount = ret.value.advance_payment_amount;
                    vm.model.settlement_info.charge_total = ret.value.charge_total;
                }
            });
        }

        function chargeList() {

            ngDialog.open({
                template: 'in-charge-list.html',
                controller: 'DialogInChargeListController',
                className: 'ngdialog-theme-default ngdialog-in-charge-list',
                data: {
                    vmh: vmh,
                    viewTranslatePathRoot: vm.viewTranslatePath(),
                    titleTranslatePath: vm.viewTranslatePath('EXIT-SETTLEMENT'),
                    elderlyId: vm.model.elderlyId
                }
            });
        }

    }

})();