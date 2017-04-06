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
        .controller('NursingStationElderlyDialogController', NursingStationElderlyDialogController)
    ;

    NursingStationController.$inject = ['$scope', 'ngDialog', 'blockUI' ,'SOCKET_EVENTS', 'SocketManager', 'vmh', 'instanceVM'];

    function NursingStationController($scope, ngDialog, blockUI, SOCKET_EVENTS, SocketManager, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;

        init();

        function init() {

            vm.init({removeDialog: ngDialog});

            vm.onFloorChange = onFloorChange;
            vm.toggleAlarmQueue = toggleAlarmQueue;
            vm.openAlarmDialogByAlarm = openAlarmDialogByAlarm;
            vm.openAlarmDialogByMonitorObject = openAlarmDialogByMonitorObject;
            vm.openElderlyDialog = openElderlyDialog;

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
            processAlarmQueue();
        }
        function subscribeBedMonitor () {
            var channel = SocketManager.registerChannel(SOCKET_EVENTS.PSN.BED_MONITOR.$SOCKET_URL);
            channel.on(SOCKET_EVENTS.SHARED.CONNECT, function() {
                console.log('nursing-station socket connected');
            });
            channel.on(SOCKET_EVENTS.SHARED.DISCONNECT, function() {
                console.log('nursing-station socket disconnected');
            });
            channel.off(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.ON_LINE).on(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.ON_LINE, function(data) {
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
            channel.off(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.OFF_LINE).on(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.OFF_LINE, function(data) {
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
            channel.off(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.COME).on(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.COME, function(data) {
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
            channel.off(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.LEAVE).on(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.LEAVE, function(data) {
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
            channel.off(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.ALARM_LEAVE_TIMEOUT).on(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.ALARM_LEAVE_TIMEOUT, function(data){
                console.log('nursing-station socket ALARM_LEAVE_TIMEOUT =>', data);
                var elderlyId = vm.bedMonitorMappingElderly[data.bedMonitorName];
                console.log('on alarm elderlyId=>', elderlyId);
                if (_.findIndex(vm.alarmQueue, function(alarmObject){
                        return alarmObject.elderlyId == elderlyId && alarmObject.reason == data.reason;
                    }) == -1) {
                    var elderly = _.find(vm.elderlys, function (elderly) {
                        return elderly._id == elderlyId;
                    });
                    var alarm = _.extend({elderly: elderly, processed: false}, data);
                    vm.alarmQueue.push(alarm);
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

        function toggleAlarmQueue () {
            console.log('toggleAlarmQueue');
            vm.alarmQueueVisible = !vm.alarmQueueVisible;
            vm.toggleAlarmButton = vm.alarmQueueVisible ? vm.moduleTranslatePath('COLLAPSE-ALARM-QUEUE') : vm.moduleTranslatePath('EXPAND-ALARM-QUEUE');
        }

        function processAlarmQueue () {
            console.log('processAlarmQueue:', vm.alarmQueue.length);
            if(vm.alarmQueue.length > 0) {
                openAlarmDialog(vm.alarmQueue[0]);
            } else {
                vmh.timeout(function () {
                    processAlarmQueue();
                }, 1000);
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
                template: 'nursing-station-alarm.html',
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
            }).closePromise.then(function (ret) {
                if(ret.value!='$document' && ret.value!='$closeButton' && ret.value!='$escape' ) {
                    console.log(ret);
                    var index = _.findIndex(vm.alarmQueue, function(o) {
                        return o === alarm;
                    });
                    if(index != -1) {
                        vm.alarmQueue.splice(index);
                        vmh.alertSuccess('button.CLOSE', true);
                    }
                }
                vmh.timeout(function () {
                    processAlarmQueue();
                }, 1000);
            });
        }

        function openElderlyDialog (elderly) {
            ngDialog.open({
                template: 'nursing-station-elderly.html',
                controller: 'NursingStationElderlyDialogController',
                className: 'ngdialog-theme-default ngdialog-nursing-station-elderly',
                data: {
                    vmh: vmh,
                    moduleTranslatePathRoot: vm.moduleTranslatePath(),
                    defaultElderlyAvatar: vm.defaultElderlyAvatar,
                    elderly: elderly,
                    tenantId: vm.tenantId,
                    operated_by: vm.operated_by,
                    operated_by_name: vm.operated_by_name
                }
            }).closePromise.then(function (ret) {
                if(ret.value!='$document' && ret.value!='$closeButton' && ret.value!='$escape' ) {
                    console.log('openElderlyDialog close')
                }
            });
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
            vm.closeAlarm = closeAlarm;
        }


        function closeAlarm() {
            var promise = ngDialog.openConfirm({
                template: 'customConfirmDialog.html',
                className: 'ngdialog-theme-default',
                controller: ['$scope', function ($scopeConfirm) {
                    $scopeConfirm.message = vm.moduleTranslatePath('DLG-ALARM-TO-CONFIRM-CLOSE')
                }]
            }).then(function () {
                $scope.closeThisDialog({alarmClosed: true});
                vmh.psnService.nursingStationCloseBedMonitorAlarm(vm.alarm, {
                    tenantId: vm.tenantId,
                    operated_by: vm.operated_by,
                    operated_by_name: vm.operated_by_name
                }).then(function (ret) {
                    $scope.closeThisDialog({alarmClosed: true});
                }, function (err) {
                    console.log(err);
                });
            });
        }
    }

    NursingStationElderlyDialogController.$inject = ['$scope','ngDialog'];

    function NursingStationElderlyDialogController($scope, ngDialog) {

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
            vm.elderly = $scope.ngDialogData.elderly;
            vm.tenantId = $scope.ngDialogData.tenantId;
            vm.operated_by = $scope.ngDialogData.operated_by;
            vm.operated_by_name = $scope.ngDialogData.operated_by_name;

            vm.onAvatarUploaded = onAvatarUploaded;
            // vm.tab1 = {cid: 'contentTab1', active: true};

            vmh.parallel([
                vmh.shareService.d2('D1012'),
                vmh.getModelService('psn-elderly').single({_id: vm.elderly._id},'nursing_assessment_grade family_members'),
                vmh.psnService.nursingScheduleByElderlyDaily(vm.tenantId, vm.elderly._id),
                vmh.psnService.nursingRecordsByElderlyToday(vm.tenantId, vm.elderly._id)
            ]).then(function (results) {
                vm.nursing_assessment_grade_name = results[1].nursing_assessment_grade_name;
                vm.family_members = _.map(results[1].family_members, function (o) {
                    return (results[0][o.relation_with] || {}).name + ':' + o.name + '(' + o.phone + ')'
                }).join();
                vm.nursingWorkerNames = _.map(results[2], function (o) {
                    return (o.aggr_value || {}).name;
                }).join();
                vm.nursingRecords = results[3];
            });
        }

        function onAvatarUploaded (uploadedUrl) {
            if (uploadedUrl) {
                vmh.fetch(vmh.getModelService('psn-elderly').update(vm.elderly._id, {avatar: uploadedUrl}));
            }
        }
    }
})();