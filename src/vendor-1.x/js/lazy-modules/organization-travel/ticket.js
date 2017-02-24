/**
 * Created by zppro on 16-9-21.
 * Target:票付通接口数据 门票
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-travel')
        .controller('PFT_TicketGridController', PFT_TicketGridController)
        .controller('PFT_TicketDetailsController', PFT_TicketDetailsController)
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
                vm.searchForm['scenicSpotId'] = undefined;
                vm.treeFilterObject['tenantId'] = undefined;
                vm.UUid = $scope.$stateParams.scenicSpotId;
                console.log(vm.UUid);
                vm.treeDataPromise = vmh.shareService.tmp('T3001/idc-scenicSpot_PFT', 'UUid show_name name', vm.treeFilterObject);

                $scope.$on('tree:node:select', function ($event, node) {

                    vm.UUid = vm.searchForm['UUlid'] = node.UUid;
                    console.log(vm.UUid);
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

        function syncInterfaceTicket(scenicSpotId) {

            ngDialog.openConfirm({
                template: 'normalConfirmDialog.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            }).then(function () {
                vm.blocker.start();
                vmh.idtService.PFT$syncTicket(scenicSpotId).then(function(){
                    vm.query();
                    vmh.alertSuccess();
                }).finally(function(){
                    vm.blocker.stop();
                });
            });
        }
    }

    PFT_TicketDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function PFT_TicketDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;


        init();

        function init() {

            vm.init({removeDialog: ngDialog});

            vm.doSubmit = doSubmit;
            vm.tab1 = {cid: 'contentTab1'};
            vm.tab2 = {cid: 'contentTab2',active:true};
            vm.load();

        }


        function doSubmit() {

            if ($scope.theForm.$valid) {
                vm.save(false, vmh.idtService.saveIDCConfigItems([
                    {
                        where: {
                            idc_name: 'idc_ticket_PFT',
                            primary_key: 'UUid',
                            primary_value: vm.model.UUid,
                            config_key: 'show_name'
                        },
                        value: vm.model.show_name
                    },
                    {
                        where: {
                            idc_name: 'idc_ticket_PFT',
                            primary_key: 'UUid',
                            primary_value: vm.model.UUid,
                            config_key: 'sale_price'
                        },
                        value: vm.model.sale_price
                    }
                ]));
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
                if ($scope.utils.vtab(vm.tab2.cid)) {
                    vm.tab2.active = true;
                }
            }
        }
    }
    
})();
