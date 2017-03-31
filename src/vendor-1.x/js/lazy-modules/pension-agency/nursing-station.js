/**
 * district Created by zppro on 17-3-29.
 * Target:养老机构 护士台
 */

(function() {
    'use strict';
    
    angular
        .module('subsystem.pension-agency')
        .controller('NursingStationController', NursingStationController)
    ;

    NursingStationController.$inject = ['$scope', 'ngDialog', 'blockUI' ,'SOCKET_EVENTS', 'SocketManager', 'vmh', 'instanceVM'];

    function NursingStationController($scope, ngDialog, blockUI, SOCKET_EVENTS, SocketManager, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;

        init();

        function init() {

            vm.init({removeDialog: ngDialog});

            vm.onFloorChange = onFloorChange;
            
            vm.defaultElderlyAvatar = 'app/img/user/avatar-in-nursing-station.png';
            vm.nursingStationBlocker = blockUI.instances.get('nursing-station');

            vm.floorDataPromise = vmh.shareService.tmp('T3008', null, {tenantId:vm.tenantId}).then(function(nodes){
                console.log(nodes);
                return nodes;
            });
            
            vm.elderlyStatusMonitor = {};
            vm.monitorStatus = {};
            vm.bedMonitorMappingElderly = {};
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
            channel.on(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.ON_LINE, (data) => {
                console.log('nursing-station socket ON_LINE =>', data);
                // var bedMonitorStatus = vm.monitorStatus[data.bedMonitorName];
                // var bedMonitorStatus = vm.elderlyStatusMonitor[vm.bedMonitorMappingElderly[data.bedMonitorName]];
                if (vm.elderlyStatusMonitor[vm.bedMonitorMappingElderly[data.bedMonitorName]]) {
                    vm.elderlyStatusMonitor[vm.bedMonitorMappingElderly[data.bedMonitorName]].status = 'online';
                    console.log('bedMonitorStatus:', vm.elderlyStatusMonitor[vm.bedMonitorMappingElderly[data.bedMonitorName]]);
                }

            });
            channel.on(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.OFF_LINE, (data) => {
                console.log('nursing-station socket OFF_LINE =>', data);
                // var bedMonitorStatus = vm.elderlyStatusMonitor[vm.bedMonitorMappingElderly[data.bedMonitorName]];
                if (bedMonitorStatus) {
                    bedMonitorStatus.status = 'offline';
                    console.log('bedMonitorStatus:', vm.elderlyStatusMonitor[vm.bedMonitorMappingElderly[data.bedMonitorName]]);
                }
            });
            channel.on(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.COME, (data) => {
                console.log('nursing-station socket COME =>', data);
                // var bedMonitorStatus = vm.elderlyStatusMonitor[vm.bedMonitorMappingElderly[data.bedMonitorName]];
                if (vm.elderlyStatusMonitor[vm.bedMonitorMappingElderly[data.bedMonitorName]]) {
                    vm.elderlyStatusMonitor[vm.bedMonitorMappingElderly[data.bedMonitorName]].status = 'alarm';
                    console.log('bedMonitorStatus:', vm.elderlyStatusMonitor[vm.bedMonitorMappingElderly[data.bedMonitorName]]);
                }
            });
            channel.on(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.LEAVE, (data) => {
                console.log('nursing-station socket LEAVE =>', data);
                // var bedMonitorStatus = vm.elderlyStatusMonitor[vm.bedMonitorMappingElderly[data.bedMonitorName]];
                if (vm.elderlyStatusMonitor[vm.bedMonitorMappingElderly[data.bedMonitorName]]) {
                    vmh.timeout(function(){
                        vm.elderlyStatusMonitor[vm.bedMonitorMappingElderly[data.bedMonitorName]].status = 'warning';
                        console.log('bedMonitorStatus:', vm.elderlyStatusMonitor[vm.bedMonitorMappingElderly[data.bedMonitorName]]);
                    })
                }
            });
            channel.on(SOCKET_EVENTS.PSN.BED_MONITOR.S2C.ALARM_LEAVE_TIMEOUT, (data) => {
                console.log('nursing-station socket LEAVE_TIME =>', data);
                // var bedMonitorStatus = vm.elderlyStatusMonitor[vm.bedMonitorMappingElderly[data.bedMonitorName]];
                if (vm.elderlyStatusMonitor[vm.bedMonitorMappingElderly[data.bedMonitorName]]) {
                    vm.elderlyStatusMonitor[vm.bedMonitorMappingElderly[data.bedMonitorName]].status = 'alarm';
                    console.log('bedMonitorStatus:', vm.elderlyStatusMonitor[vm.bedMonitorMappingElderly[data.bedMonitorName]]);
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

    }
})();