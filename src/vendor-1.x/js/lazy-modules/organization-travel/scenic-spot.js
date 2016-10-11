/**
 * Created by zppro on 16-9-21.
 * Target:票付通接口数据
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-travel.scenic-spot',[])
        .controller('PFT_ScenicSpotGridController', PFT_ScenicSpotGridController)
        .controller('PFT_ScenicSpotDetailsController', PFT_ScenicSpotDetailsController)
    ;


    PFT_ScenicSpotGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function PFT_ScenicSpotGridController($scope, ngDialog, vmh, vm) {
        $scope.vm = vm;
        $scope.utils = vmh.utils.g; 

        init();


        function init() {
            vm.init({removeDialog: ngDialog});

            vm.syncInterfaceData = syncInterfaceData;
 

            // vmh.translate(vm.viewTranslatePath('RESET-USER-PASSWORD-COMMENT')).then(function (ret) {
            //     $scope.dialogData = {details: ret};
            // });
            vm.searchForm['tenantId'] = undefined;
            vm.query();
        }

        function syncInterfaceData() {
            ngDialog.openConfirm({
                template: 'normalConfirmDialog.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            }).then(function () {

                vmh.idtService.PFT$syncScenicSpot().then(function(){
                    vm.query();
                    vmh.alertSuccess();
                });
            });
        }
    }

    PFT_ScenicSpotDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function PFT_ScenicSpotDetailsController($scope, ngDialog, vmh, vm) {

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
                vm.save(false, vmh.extOfOrganizationOfTravelService.saveIDCConfigItems([
                    {
                        where: {
                            idc_name: 'idc_scenicSpot_PFT',
                            primary_key: 'UUid',
                            primary_value: vm.model.UUid,
                            config_key: 'show_name'
                        },
                        value: vm.model.show_name
                    },
                    {
                        where: {
                            idc_name: 'idc_scenicSpot_PFT',
                            primary_key: 'UUid',
                            primary_value: vm.model.UUid,
                            config_key: 'introduction_url'
                        },
                        value: vm.model.introduction_url
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
