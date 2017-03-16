/**
 * district Created by zppro on 17-3-14.
 * Target:养老机构 模版计划
 */

(function() {
    'use strict';
    
    angular
        .module('subsystem.pension-agency')
        .controller('NursingPlanController', NursingPlanController)
        .controller('NursingPlanSaveAsTemplateController', NursingPlanSaveAsTemplateController)
    ;

    NursingPlanController.$inject = ['$scope', 'ngDialog', 'vmh', 'instanceVM'];

    function NursingPlanController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;

        init();

        function init() {

            vm.init({removeDialog: ngDialog});
 
            vm.preWeek = preWeek;
            vm.nextWeek = nextWeek;
            vm.onRoomChange = onRoomChange;
            vm.selectGrid = selectGrid;
            vm.selectGridCol = selectGridCol;
            vm.selectGridRow = selectGridRow;
            vm.selectGridCell = selectGridCell;
            vm.saveSelected = saveSelected;
            vm.removeSelected = removeSelected;
            vm.importTemplate = importTemplate;
            vm.saveAsTemplate = saveAsTemplate;
            vm.tab1 = {cid: 'contentTab1'};

            fetchNursingPlanTemplates();
            vmh.shareService.tmp('T3001/psn-nursingWorker', 'name', {tenantId: vm.tenantId, status: 1, stop_flag: false}).then(function (treeNodes) {
                vm.selectBinding.nursingWorkers = treeNodes;
            });

            vm.baseWeek = 0;
            var p1 = loadWeek();
            var p2 = vm.yAxisDataPromise = vmh.shareService.tmp('T3009', null, {tenantId:vm.tenantId}).then(function(nodes){
                console.log('yAxisDataPromise');
                return nodes;
            });
        }


        function fetchNursingPlanTemplates () {
            vmh.shareService.tmp('T3001/psn-nursingPlanTemplate', 'name', {tenantId: vm.tenantId, status: 1, stop_flag: false}, true).then(function (treeNodes) {
                vm.selectBinding.nursingPlanTemplates = treeNodes;
            });
        }
        
        function preWeek() {
            loadWeek(-1);
        }
        function nextWeek() {
            loadWeek(1);
        }
        function loadWeek(delta) {
            vm.baseWeek += delta || 0;
            return vmh.blocking(vmh.shareService.tmp('T0100', null, {delta: vm.baseWeek}, true).then(function (treeNodes) {
                vm.xAxisData = treeNodes;
                vm.cols = {};
                for (var j=0, xlen = vm.xAxisData.length;j<xlen;j++) {
                    var colId = vm.xAxisData[j]._id;
                    vm.cols[colId] = false;//selectedCol control variable
                }
                queryNursingPlan();
            }));
        }
        
        function queryNursingPlan() {
            var start = vm.xAxisData[0].value;
            var end = vm.xAxisData[vm.xAxisData.length-1].value;
            var p3 = vmh.psnService.nursingPlanWeekly(vm.tenantId, start, end).then(parseNursingPlan);
        }

        function parseNursingPlan(nursingPlan) {
            console.log('parse nursingPlanItems');
            var nursingPlanItems = nursingPlan.items;
            vm.yAxisData = nursingPlan.yAxisData;
            var nursingWorkers = vm.selectBinding.nursingWorkers;
            vm.aggrData = {};
            for(var i=0,len=nursingPlanItems.length;i<len;i++) {
                var nursingPlanItem = nursingPlanItems[i];
                var nursingWorkerObject = _.find(nursingWorkers, function(o){
                    return o._id == nursingPlanItem.aggr_value
                });
                if (nursingWorkerObject) {
                    if (!vm.aggrData[nursingPlanItem.y_axis]) {
                        vm.aggrData[nursingPlanItem.y_axis] = {};
                    }
                    vm.aggrData[nursingPlanItem.y_axis][nursingPlanItem.x_axis_value] = nursingWorkerObject;
                }
            }
        }
        
        function onRoomChange () {
            console.log('onRoomChange');
            exitGridEditMode();
            enterGridEditMode()
        }

        function enterGridEditMode () {
            vm.gridEditing = true;
            if (!vm.aggrData) {
                vm.aggrData = {};
            }
            if (!vm.cells) {
                vm.cells = {};
            }
            for(var i=0, ylen = vm.yAxisData.length;i< ylen;i++) {
                var rowId = vm.yAxisData[i]._id;
                var rowDataObject = vm.aggrData[rowId];
                if (!rowDataObject) {
                    rowDataObject = vm.aggrData[rowId] = {};
                }
                var rowCellsObject = vm.cells[rowId];
                if (!rowCellsObject) {
                    rowCellsObject = vm.cells[rowId] = {'row-selected': false};
                }
                for (var j=0, xlen = vm.xAxisData.length;j<xlen;j++) {
                    var colId = vm.xAxisData[j]._id;
                    var aggrValue = rowDataObject[colId];
                    if(aggrValue === undefined) {
                        rowDataObject[colId] = "";
                    }
                    var cell = rowCellsObject[colId];
                    if(cell === undefined) {
                        rowCellsObject[colId] = false;
                    }
                }
            }
        }
        
        function exitGridEditMode () {
            _unSelectAll();
            vm.gridEditing = false;
        }

        function _unSelectAll () {
            for(var i=0, ylen = vm.yAxisData.length;i< ylen;i++) {
                var rowId = vm.yAxisData[i]._id;
                if (vm.cells && vm.cells[rowId]) {
                    vm.cells[rowId]['row-selected'] = false;
                    for (var j=0, xlen = vm.xAxisData.length;j<xlen;j++) {
                        var colId = vm.xAxisData[j]._id;
                        vm.cells[rowId][colId] = false
                        if (vm.cols[colId]){
                            vm.cols[colId] = false;
                        }
                    }
                }
            }
        }

        function _checkWholeRowIsSelected (rowId) {
            var wholeRowSelected = true;
            for (var j=0, xlen = vm.xAxisData.length;j<xlen;j++) {
                var colId2 = vm.xAxisData[j]._id;
                wholeRowSelected = wholeRowSelected  && vm.cells[rowId][colId2];
                if (!wholeRowSelected){
                    break;
                }
            }
            return wholeRowSelected;
        }

        function _checkWholeColIsSelected (colId) {
            var wholeColSelected = true;
            for(var i=0, ylen = vm.yAxisData.length;i< ylen;i++) {
                var rowId = vm.yAxisData[i]._id;
                wholeColSelected = wholeColSelected  && vm.cells[rowId][colId];
                if (!wholeColSelected){
                    break;
                }
            }
            return wholeColSelected;
        }

        function selectGrid() {
            if(!vm.gridEditing) return;
            for(var i=0, ylen = vm.yAxisData.length;i< ylen;i++) {
                var rowId = vm.yAxisData[i]._id;
                selectGridRow(rowId);
            }
        }

        function selectGridCol(colId) {
            if(!vm.gridEditing) return;
            var newColSelected = vm.cols[colId] = !vm.cols[colId]
            for(var i=0, ylen = vm.yAxisData.length;i< ylen;i++) {
                var rowId = vm.yAxisData[i]._id;
                vm.cells[rowId][colId] = newColSelected;
                vm.cells[rowId]['row-selected'] = _checkWholeRowIsSelected(rowId);
            }
        }

        function selectGridRow(rowId) {
            if(!vm.gridEditing) return;
            var newRowSelected = vm.cells[rowId]['row-selected'] = !vm.cells[rowId]['row-selected'];
            for (var j=0, xlen = vm.xAxisData.length;j<xlen;j++) {
                var colId = vm.xAxisData[j]._id;
                vm.cells[rowId][colId] = newRowSelected;
                vm.cols[colId] = _checkWholeColIsSelected(colId);
            }
        }

        function selectGridCell (rowId, colId) {
            console.log(vm.gridEditing)
            if(!vm.gridEditing) return;

            vm.cells[rowId][colId] = !vm.cells[rowId][colId];
            vm.cells[rowId]['row-selected'] = _checkWholeRowIsSelected(rowId);
            vm.cols[colId] = _checkWholeColIsSelected(colId);
        }

        function saveSelected () {
            if (!vm.selectedNursingWorker) {
                vmh.alertWarning(vm.moduleTranslatePath('MSG-NO-PICK-NURSING'), true);
                return;
            }
            var toSaveRows = [];
            for(var i=0, ylen = vm.yAxisData.length;i< ylen;i++) {
                var rowId = vm.yAxisData[i]._id;
                for (var j=0, xlen = vm.xAxisData.length;j<xlen;j++) {
                    var colId = vm.xAxisData[j]._id;
                    var date = vm.xAxisData[j].value;
                    if (vm.cells[rowId][colId]) {
                        console.log(vm.selectedNursingWorker);
                        vm.aggrData[rowId][colId] = vm.selectedNursingWorker;
                        vm.cells[rowId][colId] = false;
                        vm.cells[rowId]['row-selected'] = _checkWholeRowIsSelected(rowId);
                        vm.cols[colId] = _checkWholeColIsSelected(colId);
                        toSaveRows.push({ x_axis: date, y_axis: rowId, aggr_value: vm.selectedNursingWorker.id });
                    }
                }
            }
            if(toSaveRows.length > 0) {
                vmh.psnService.nursingPlanSave(vm.tenantId, toSaveRows).then(function(){
                    vmh.alertSuccess();
                });
            }
        }

        function removeSelected () {
            ngDialog.openConfirm({
                template: 'removeConfirmDialog.html',
                className: 'ngdialog-theme-default'
            }).then(function () {
                var toRemoveRows = [];
                for(var i=0, ylen = vm.yAxisData.length;i< ylen;i++) {
                    var rowId = vm.yAxisData[i]._id;
                    for (var j=0, xlen = vm.xAxisData.length;j<xlen;j++) {
                        var colId = vm.xAxisData[j]._id;
                        var date = vm.xAxisData[j].value;
                        if (vm.cells[rowId][colId]) {
                            vm.cells[rowId][colId] = false;
                            vm.cells[rowId]['row-selected'] = _checkWholeRowIsSelected(rowId);
                            vm.cols[colId] = _checkWholeColIsSelected(colId);

                            if (vm.aggrData[rowId][colId]) {
                                vm.aggrData[rowId][colId] = null;
                                toRemoveRows.push({ x_axis: date, y_axis: rowId });
                            }
                        }
                    }
                }
                if(toRemoveRows.length > 0) {
                    vmh.psnService.nursingPlanRemove(vm.tenantId, toRemoveRows).then(function(){
                        vmh.alertSuccess('notification.REMOVE-SUCCESS', true);
                    });
                }
            });
        }
        
        function importTemplate () {
            if (!vm.selectedNursingPlanTemplate) {
                vmh.alertWarning(vm.moduleTranslatePath('MSG-NO-PICK-NURSING_PLAN_TEMPLATE'), true);
                return;
            }

            ngDialog.openConfirm({
                template: 'customConfirmDialog.html',
                className: 'ngdialog-theme-default',
                controller: ['$scope', function ($scopeConfirm) {
                    $scopeConfirm.message = vm.moduleTranslatePath('DIALOG-IMPORT-MESSAGE')
                }]
            }).then(function () {
                var toImportXAxisRange = vm.xAxisData.map(function (o) {return o.value });
                console.log(vm.selectedNursingPlanTemplate._id);
                vmh.psnService.nursingPlanTemplateImport(vm.selectedNursingPlanTemplate._id, toImportXAxisRange).then(function(){
                    vmh.alertSuccess('notification.NORMAL-SUCCESS', true);
                    loadWeek();
                });
            });
        }

        function saveAsTemplate () {

            var toSaveRows = [];
            for(var i=0, ylen = vm.yAxisData.length;i< ylen;i++) {
                var rowId = vm.yAxisData[i]._id;
                for (var j=0, xlen = vm.xAxisData.length;j<xlen;j++) {
                    var colId = vm.xAxisData[j]._id;
                    if(!vm.aggrData[rowId][colId]){
                        vmh.alertWarning(vm.moduleTranslatePath('MSG-SAVE-AS-TEMPLATE-DATA-INVALID'), true);
                        return;
                    } else {
                        toSaveRows.push({ x_axis: moment(vm.xAxisData[j].value).day(), y_axis: rowId, aggr_value: vm.aggrData[rowId][colId] });
                    }
                }
            }
            
            ngDialog.open({
                template: 'nursing-plan-save-as-template.html',
                controller: 'NursingPlanSaveAsTemplateController',
                className: 'ngdialog-theme-default ngdialog-nursing-plan-save-as-template',
                data: {
                    vmh: vmh,
                    moduleTranslatePathRoot: vm.moduleTranslatePath(),
                    tenantId: vm.tenantId,
                    nursingPlanTemplates: vm.selectBinding.nursingPlanTemplates,
                    toSaveRows: toSaveRows
                }
            }).closePromise.then(function (ret) {
                if(ret.value!='$document' && ret.value!='$closeButton' && ret.value!='$escape' ) {
                    console.log(ret.value)
                    if(ret.value === true){
                        console.log('fetchNursingPlanTemplates')
                        fetchNursingPlanTemplates();
                    }
                }
            });
        }
    }

    NursingPlanSaveAsTemplateController.$inject = ['$scope', 'ngDialog'];

    function NursingPlanSaveAsTemplateController($scope, ngDialog) {

        var vm = $scope.vm = {};
        var vmh = $scope.ngDialogData.vmh;

        $scope.utils = vmh.utils.v;

        init();

        function init() {
            vm.moduleTranslatePathRoot = $scope.ngDialogData.moduleTranslatePathRoot;
            vm.moduleTranslatePath = function(key) {
                return vm.moduleTranslatePathRoot + '.' + key;
            };
            vm.tenantId = $scope.ngDialogData.tenantId;
            vm.fetchNursingPlanTemplatesPromise = vmh.promiseWrapper($scope.ngDialogData.nursingPlanTemplates);
            vm.toSaveRows = $scope.ngDialogData.toSaveRows;

            vm.selectNuringPlanTemplateToSave = selectNuringPlanTemplateToSave;
            vm.cancel = cancel;
            vm.doSubmit = doSubmit;
        }

        function selectNuringPlanTemplateToSave(selectedNode) {
            console.log(selectedNode);
            vmh.timeout(function(){
                vm.nursingPlanTemplateName = selectedNode.name;
            }, 25);
        }

        function cancel(){
            $scope.closeThisDialog('$closeButton');
        }

        function doSubmit() {
            if ($scope.theForm.$valid) {
                var promise = ngDialog.openConfirm({
                    template: 'customConfirmDialog.html',
                    className: 'ngdialog-theme-default',
                    controller: ['$scope', function ($scopeConfirm) {
                        $scopeConfirm.message = vm.moduleTranslatePath('CONFIRM-MESSAGE-SAVE-AS-TEMPLATE')
                    }]
                }).then(function () {
                    vmh.psnService.nursingPlanSaveAsTemplateWeekly(vm.tenantId, vm.nursingPlanTemplateName, vm.toSaveRows).then(function (isCreate) {
                        $scope.closeThisDialog(isCreate);
                        vmh.alertSuccess();
                    });
                });
            }
        }
    }
})();