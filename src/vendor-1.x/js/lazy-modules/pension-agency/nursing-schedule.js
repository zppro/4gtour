/**
 * district Created by zppro on 17-3-17.
 * Target:养老机构 排班
 */

(function() {
    'use strict';
    
    angular
        .module('subsystem.pension-agency')
        .controller('NursingScheduleController', NursingScheduleController)
        .controller('NursingScheduleSaveAsTemplateController', NursingScheduleSaveAsTemplateController)
    ;

    NursingScheduleController.$inject = ['$scope', 'ngDialog', 'vmh', 'instanceVM'];

    function NursingScheduleController($scope, ngDialog, vmh, vm) {

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

            fetchNursingScheduleTemplates();
            vmh.shareService.tmp('T3001/psn-nursingWorker', 'name', {tenantId: vm.tenantId, status: 1, stop_flag: false}).then(function (treeNodes) {
                vm.selectBinding.nursingWorkers = treeNodes;
            });

            vm.baseWeek = 0;
            var p1 = loadWeek();
            var p2 = vm.yAxisDataPromise = vmh.shareService.tmp('T3009', null, {tenantId:vm.tenantId}).then(function(nodes){
                return nodes;
            });
        }


        function fetchNursingScheduleTemplates () {
            vmh.shareService.tmp('T3001/psn-nursingScheduleTemplate', 'name', {tenantId: vm.tenantId, status: 1, stop_flag: false}, true).then(function (treeNodes) {
                vm.selectBinding.nursingScheduleTemplates = treeNodes;
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
                queryNursingSchedule();
            }));
        }
        
        function queryNursingSchedule() {
            var start = vm.xAxisData[0].value;
            var end = vm.xAxisData[vm.xAxisData.length-1].value;
            var p3 = vmh.psnService.nursingScheduleWeekly(vm.tenantId, start, end).then(parseNursingSchedule);
        }

        function parseNursingSchedule(nursingSchedule) {
            console.log('parse nursingScheduleItems');
            var nursingScheduleItems = nursingSchedule.items;
            // vm.yAxisData = nursingSchedule.yAxisData;
            var nursingWorkers = vm.selectBinding.nursingWorkers;
            vm.aggrData = {};
            for(var i=0,len=nursingScheduleItems.length;i<len;i++) {
                var nursingScheduleItem = nursingScheduleItems[i];
                var nursingWorkerObject = _.find(nursingWorkers, function(o){
                    return o._id == nursingScheduleItem.aggr_value
                });
                if (nursingWorkerObject) {
                    if (!vm.aggrData[nursingScheduleItem.y_axis]) {
                        vm.aggrData[nursingScheduleItem.y_axis] = {};
                    }
                    vm.aggrData[nursingScheduleItem.y_axis][nursingScheduleItem.x_axis_value] = nursingWorkerObject;
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
                vmh.psnService.nursingScheduleSave(vm.tenantId, toSaveRows).then(function(){
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
                    vmh.psnService.nursingScheduleRemove(vm.tenantId, toRemoveRows).then(function(){
                        vmh.alertSuccess('notification.REMOVE-SUCCESS', true);
                    });
                }
            });
        }
        
        function importTemplate () {
            console.log('selectedNursingScheduleTemplate')

            if (!vm.selectedNursingScheduleTemplate) {
                console.log(vm.moduleTranslatePath('MSG-NO-PICK-NURSING_SCHEDULE_TEMPLATE'));
                vmh.alertWarning(vm.moduleTranslatePath('MSG-NO-PICK-NURSING_SCHEDULE_TEMPLATE'), true);
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
                console.log(vm.selectedNursingScheduleTemplate._id);
                vmh.psnService.nursingScheduleTemplateImport(vm.selectedNursingScheduleTemplate._id, toImportXAxisRange).then(function(){
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
                template: 'nursing-schedule-save-as-template.html',
                controller: 'NursingScheduleSaveAsTemplateController',
                className: 'ngdialog-theme-default ngdialog-nursing-schedule-save-as-template',
                data: {
                    vmh: vmh,
                    moduleTranslatePathRoot: vm.moduleTranslatePath(),
                    tenantId: vm.tenantId,
                    nursingScheduleTemplates: vm.selectBinding.nursingScheduleTemplates,
                    toSaveRows: toSaveRows
                }
            }).closePromise.then(function (ret) {
                if(ret.value!='$document' && ret.value!='$closeButton' && ret.value!='$escape' ) {
                    console.log(ret.value)
                    if(ret.value === true){
                        console.log('fetchNursingScheduleTemplates')
                        fetchNursingScheduleTemplates();
                    }
                }
            });
        }
    }

    NursingScheduleSaveAsTemplateController.$inject = ['$scope', 'ngDialog'];

    function NursingScheduleSaveAsTemplateController($scope, ngDialog) {

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
            vm.fetchNursingScheduleTemplatesPromise = vmh.promiseWrapper($scope.ngDialogData.nursingScheduleTemplates);
            vm.toSaveRows = $scope.ngDialogData.toSaveRows;

            vm.selectNuringScheduleTemplateToSave = selectNuringScheduleTemplateToSave;
            vm.cancel = cancel;
            vm.doSubmit = doSubmit;
        }

        function selectNuringScheduleTemplateToSave(selectedNode) {
            console.log(selectedNode);
            vmh.timeout(function(){
                vm.nursingScheduleTemplateName = selectedNode.name;
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
                    vmh.psnService.nursingScheduleSaveAsTemplateWeekly(vm.tenantId, vm.nursingScheduleTemplateName, vm.toSaveRows).then(function (isCreate) {
                        $scope.closeThisDialog(isCreate);
                        vmh.alertSuccess();
                    });
                });
            }
        }
    }
})();