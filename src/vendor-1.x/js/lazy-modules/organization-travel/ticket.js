/**
 * Created by zppro on 16-9-21.
 * Target:票付通接口数据
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-travel.ticket',[])
        .controller('PFT_TicketGridController', PFT_TicketGridController)
    ;


    PFT_TicketGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function PFT_TicketGridController($scope, ngDialog, vmh, vm) {
        $scope.vm = vm;
        $scope.utils = vmh.utils.g; 

        init();


        function init() {
            vm.init({removeDialog: ngDialog});

            vm.syncInterfaceTicket = syncInterfaceTicket;

            if (vm.switches.leftTree) {
                vm.treeFilterObject['tenantId'] = undefined;
                vm.treeDataPromise = vmh.shareService.tmp('T3001/idc-scenicSpot_PFT', 'UUid UUtitle name', vm.treeFilterObject);

                $scope.$on('tree:node:select', function ($event, node) {

                    vm.UUid = vm.searchForm['UUlid'] = node.UUid;

                    vm.query();
                    // if ($scope.$stateParams.scenicSpotId != selectNodeId) {
                    //     //timeout跳出事件监听
                    //     vmh.timeout(function(){
                    //         $scope.$state.go(vm.viewRoute(), {scenicSpotId: selectNodeId});
                    //     })
                    // }
                });
            }
            vm.searchForm['tenantId'] = undefined;
            vm.query();
        }

        function syncInterfaceTicket(UUid) {
            ngDialog.openConfirm({
                template: 'normalConfirmDialog.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            }).then(function () {

                vmh.idtService.PFT$Sync_ScenicSpot().then(function(){
                    vm.query();
                    vmh.alertSuccess();
                });
            });
        }
    }
    
})();
