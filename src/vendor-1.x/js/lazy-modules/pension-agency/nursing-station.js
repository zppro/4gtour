/**
 * district Created by zppro on 17-3-29.
 * Target:养老机构 护士台
 */

(function() {
    'use strict';
    
    angular
        .module('subsystem.pension-agency')
        .controller('NursingStationController', NursingStationController)
        .controller('NursingStationAlarmDialogController', NursingStationAlarmDialogController)
    ;

    NursingStationController.$inject = ['$scope', 'ngDialog', 'blockUI' ,'SOCKET_EVENTS', 'SocketManager', 'vmh', 'instanceVM'];

    function NursingStationController($scope, ngDialog, blockUI, SOCKET_EVENTS, SocketManager, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;

        init();

        function init() {

            vm.init({removeDialog: ngDialog});

            vm.onFloorChange = onFloorChange;
            vm.openAlarmDialogByAlarm = openAlarmDialogByAlarm;
            vm.openAlarmDialogByMonitorObject = openAlarmDialogByMonitorObject;
            vm.toggleAlarmQueue = toggleAlarmQueue;

            vm.elderlyStatusMonitor = {};
            vm.bedMonitorMappingElderly = {};
            vm.bedMonitorStatusMonitor = {};
            vm.alarmQueue = [];
            vm.defaultElderlyAvatar = 'app/img/user/avatar-in-nursing-station.png';
            vm.nursingStationBlocker = blockUI.instances.get('nursing-station');
            vm.toggleAlarmButton = vm.moduleTranslatePath('EXPAND-ALARM-QUEUE');

            vmh.shareService.d2('D3016').then(function(data){
                vm.D3016 = data;
            });
            vm.floorDataPromise = vmh.shareService.tmp('T3008', null, {tenantId:vm.tenantId}).then(function(nodes){
                console.log(nodes);
                return nodes;
            });
            

            subscribeBedMonitor();
        }

        function subscribeBedMonitor () {
            var channel = SocketManager.registerChannel(SOCKET_EVENTS.PSN.BED_MONITOR.$SOCKET_URL);
            channel.on(SOCKET_EVENTS.SHARED.CONNECT, () => {
                console.log('nursing-station socket connected')
            });
            channel.on(SOCKET_EVENTS.SHARED.DISCONNECT, () => {
                console.log('nursing-station socket disconnected')
            });
            channel.off(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.ON_LINE).on(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.ON_LINE, (data) => {
                console.log('nursing-station socket ON_LINE =>', data);
                // var bedMonitorStatus = vm.monitorStatus[data.bedMonitorName];
                var elderlyId = vm.bedMonitorMappingElderly[data.bedMonitorName];
                var bedMonitorStatus = vm.elderlyStatusMonitor[elderlyId];
                if (bedMonitorStatus) {
                    vmh.timeout(function(){
                        bedMonitorStatus.status = 'online';
                        console.log('bedMonitorStatus:', bedMonitorStatus);
                    });
                }
            });
            channel.off(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.OFF_LINE).on(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.OFF_LINE, (data) => {
                console.log('nursing-station socket OFF_LINE =>', data);
                var elderlyId = vm.bedMonitorMappingElderly[data.bedMonitorName];
                var bedMonitorStatus = vm.elderlyStatusMonitor[elderlyId];
                if (bedMonitorStatus) {
                    vmh.timeout(function(){
                        bedMonitorStatus.status = 'offline';
                        console.log('bedMonitorStatus:', bedMonitorStatus);
                    });
                }
            });
            channel.off(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.COME).on(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.COME, (data) => {
                console.log('nursing-station socket COME =>', data);
                var elderlyId = vm.bedMonitorMappingElderly[data.bedMonitorName];
                var bedMonitorStatus = vm.elderlyStatusMonitor[elderlyId];
                if (bedMonitorStatus) {
                    vmh.timeout(function(){
                        bedMonitorStatus.status = 'online';
                        console.log('bedMonitorStatus:', bedMonitorStatus);
                    });
                }
            });
            channel.off(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.LEAVE).on(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.LEAVE, (data) => {
                console.log('nursing-station socket LEAVE =>', data);
                var elderlyId = vm.bedMonitorMappingElderly[data.bedMonitorName];
                var bedMonitorStatus = vm.elderlyStatusMonitor[elderlyId];
                if (bedMonitorStatus) {
                    vmh.timeout(function(){
                        bedMonitorStatus.status = 'warning';
                        console.log('bedMonitorStatus:', bedMonitorStatus);
                    })
                }
            });
            channel.off(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.ALARM_LEAVE_TIMEOUT).on(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.ALARM_LEAVE_TIMEOUT, (data) => {
                console.log('nursing-station socket ALARM_LEAVE_TIMEOUT =>', data);
                var elderlyId = vm.bedMonitorMappingElderly[data.bedMonitorName];
                console.log('on alarm elderlyId=>', elderlyId);
                if (_.findIndex(vm.alarmQueue, function(alarmObject){
                        return alarmObject.elderlyId == elderlyId && alarmObject.reason == data.reason;
                    }) == -1) {
                    var elderly = _.find(vm.elderlys, function (elderly) {
                        return elderly._id == elderlyId;
                    });
                    vm.alarmQueue.push(_.extend({elderly: elderly, processed: false}, data));
                    console.log('vm.alarmQueue:', vm.alarmQueue);
                }
                var bedMonitorStatus = vm.elderlyStatusMonitor[elderlyId];
                if (bedMonitorStatus) {
                    vmh.timeout(function(){
                        bedMonitorStatus.status = 'alarm';
                        console.log('bedMonitorStatus:', bedMonitorStatus);
                    })
                }
            });
        }

        function onFloorChange () {
            console.log('onFloorChange:',vm.floorData);
            if (vm.floorData.length > 0) {
                vm.nursingStationBlocker.start();
                vmh.psnService.elderlysByDistrictFloors(vm.tenantId, _.map(vm.floorData,function(o){
                    return o._id;
                })).then(function(data) {
                    vm.elderlys = data;
                    var bedMonitorNames = [], bedMonitor;
                    _.each(vm.elderlys, function (elderly) {
                        bedMonitor = _.find(elderly.room_value.roomId.bedMonitors, function (o) {
                            // console.log('o.bed_no ', o.bed_no);
                            // console.log('elderly.room_value.bed_no ', elderly.room_value.bed_no);
                            return o.bed_no == elderly.room_value.bed_no
                        });
                        if (bedMonitor) {
                            if (!vm.elderlyStatusMonitor[elderly.id]) {
                                console.log('elderly.id=>', elderly.id);
                                vm.bedMonitorMappingElderly[bedMonitor.bedMonitorName] = elderly.id;
                                vm.elderlyStatusMonitor[elderly.id] = {bedMonitorName: bedMonitor.bedMonitorName, status:'offline'};
                                bedMonitorNames.push(bedMonitor.bedMonitorName);
                            }
                        }
                    });
                    if (bedMonitorNames.length > 0) {
                        console.log('SUBSCRIBE>', bedMonitorNames);
                        var channel = SocketManager.getChannel(SOCKET_EVENTS.PSN.BED_MONITOR.$SOCKET_URL);
                        channel && channel.emit(SOCKET_EVENTS.PSN.BED_MONITOR.C2S.SUBSCRIBE, {
                            tenantId: vm.tenantId,
                            bedMonitorNames: bedMonitorNames
                        });
                    }
                }).finally(function(){
                    vm.nursingStationBlocker.stop();
                    console.log('vm.elderlyStatusMonitor', vm.elderlyStatusMonitor);
                });
            } else {
                vm.elderlys = [];
            }
        }

        function openAlarmDialogByAlarm (index) {
            console.log('openAlarmDialogByAlarm:',index);
            if (index >=0 && index < vm.alarmQueue.length) {
                var alarm = vm.alarmQueue[index];
                if (!alarm.processed) {
                    openAlarmDialog(alarm)
                }
            }
        }

        function openAlarmDialogByMonitorObject (elderlyId) {
            console.log('openAlarmDialogByMonitorObject elderly:', elderlyId);
            for (var i = 0, len = vm.alarmQueue.length, alarmObject; i < len; i++) {
                alarmObject = vm.alarmQueue[i];
                console.log('alarmObject:', alarmObject);
                if (alarmObject.elderly.id == elderlyId && alarmObject.processed == false) {
                    openAlarmDialog(alarmObject);
                    break;
                }
            }
        }

        function openAlarmDialog (alarm) {

            ngDialog.open({
                template: 'nursing-station-alarm-template.html',
                controller: 'NursingStationAlarmDialogController',
                className: 'ngdialog-theme-default ngdialog-nursing-station-alarm',
                data: {
                    vmh: vmh,
                    moduleTranslatePathRoot: vm.moduleTranslatePath(),
                    defaultElderlyAvatar: vm.defaultElderlyAvatar,
                    title: vm.D3016[alarm.reason].name,
                    alarm: alarm,
                    tenantId: vm.tenantId,
                    operated_by: vm.operated_by,
                    operated_by_name: vm.operated_by_name
                }
            });
        }

        function toggleAlarmQueue () {
            console.log('toggleAlarmQueue');
            vm.alarmQueueVisible = !vm.alarmQueueVisible;
            vm.toggleAlarmButton = vm.alarmQueueVisible ? vm.moduleTranslatePath('COLLAPSE-ALARM-QUEUE') : vm.moduleTranslatePath('EXPAND-ALARM-QUEUE');
        }
    }

    NursingStationAlarmDialogController.$inject = ['$scope','ngDialog'];

    function NursingStationAlarmDialogController($scope, ngDialog) {

        var vm = $scope.vm = {};
        var vmh = $scope.ngDialogData.vmh;

        $scope.utils = vmh.utils.v;

        init();

        function init() {
            vm.moduleTranslatePathRoot = $scope.ngDialogData.moduleTranslatePathRoot;
            vm.moduleTranslatePath = function(key) {
                return vm.moduleTranslatePathRoot + '.' + key;
            };
            vm.defaultElderlyAvatar = $scope.ngDialogData.defaultElderlyAvatar;
            vm.title = $scope.ngDialogData.title;
            vm.alarm = $scope.ngDialogData.alarm;
            vm.tenantId = $scope.ngDialogData.tenantId;
            vm.operated_by = $scope.ngDialogData.operated_by;
            vm.operated_by_name = $scope.ngDialogData.operated_by_name;
            vm.reasonMap = {};
            vm.doSubmit = doSubmit;
            vm.onChange = onChange;
        }

        function onChange(alarmReasonArchived) {
            console.log(alarmReasonArchived)
            var selected;
            for(var key in vm.reasonMap){
                if (vm.reasonMap[key]) {
                    selected = key;
                    break;
                }
            }

            if (vm.reasonMap[alarmReasonArchived]) {
                if (selected !== alarmReasonArchived) vm.reasonMap[alarmReasonArchived] = false;
            } else {
                vm.reasonMap[selected] =false;
            }
        }

        function doSubmit() {
            vm.authMsg = null;
            if ($scope.theForm.$valid) {
                var promise = ngDialog.openConfirm({
                    template: 'customConfirmDialog.html',
                    className: 'ngdialog-theme-default',
                    controller: ['$scope', function ($scopeConfirm) {
                        $scopeConfirm.message = vm.viewTranslatePath('TO-CONFIRM-SETTLEMENT-CONFIRM-MESSAGE')
                    }]
                }).then(function () {

                    //var ret = {
                    //    settlement_flag: true,
                    //    advance_payment_amount: vm.advancePayment,
                    //    charge_total: vm.recorded_charge_total + vm.unrecorded_charge_total
                    //};
                    //$scope.closeThisDialog(ret);

                    vmh.psnService.exitSettlement(vm.exitId, {
                        operated_by: vm.operated_by,
                        operated_by_name: vm.operated_by_name
                    }).then(function (ret) {
                        $scope.closeThisDialog(ret);
                    }, function (err) {
                        vm.authMsg = err;
                    });
                });
            }
        }
    }
})();