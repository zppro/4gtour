/**
 * Created by zppro on 16-9-21.
 * Target:票付通接口数据
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-travel.scenic-spot',[])
        .controller('PFT_ScenicSpotGridController', PFT_ScenicSpotGridController)
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
    
})();
