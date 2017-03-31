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

    NursingStationController.$inject = ['$scope', 'ngDialog', 'blockUI' ,'SOCKET_SERVER_EVENTS', 'vmh', 'instanceVM'];

    function NursingStationController($scope, ngDialog, blockUI, SOCKET_SERVER_EVENTS, vmh, vm) {

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
            subscribeBedMonitor();
            console.log(SOCKET_SERVER_EVENTS);
        }

        function subscribeBedMonitor () {
            var socketUrl = 'http://localhost:3002/psn$bed_monitor', socket;
            if (socketUrl.toLowerCase().startsWith('https')) {
                socket = io(socketUrl, {secure: true})
            } else {
                socket = io(socketUrl)
            }
            socket.on('connect', () => {
                console.log('group socket connected')
            });
            socket.on('disconnect', () => {
                console.log('group socket disconnected')
            });
            // socket.emit('CG001', rootState.member.self.member_id)
        }

        function onFloorChange () {
            console.log('onFloorChange:',vm.floorData);
            if (vm.floorData.length > 0) {
                vm.nursingStationBlocker.start();
                vmh.psnService.elderlysByDistrictFloors(vm.tenantId, _.map(vm.floorData,function(o){
                    return o._id;
                })).then(function(data){
                    vm.elderlys = data;
                }).finally(function(){
                    vm.nursingStationBlocker.stop();
                });
            } else {
                vm.elderlys = [];
            }
        }

    }
})();