/**
 * Created by zppro on 16-9-21.
 * Target:票付通接口数据
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-travel.scenic-spot',[])
        .controller('ScenicSpotGridController', ScenicSpotGridController) 
    ;


    ScenicSpotGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function ScenicSpotGridController($scope, ngDialog, vmh, vm) {
        $scope.vm = vm;
        $scope.utils = vmh.utils.g;
        var vmc = $scope.vmc = {};

        init();


        function init() {
            vm.init({removeDialog: ngDialog});

            vm.syncInterfaceData = syncInterfaceData;
 

            // vmh.translate(vm.viewTranslatePath('RESET-USER-PASSWORD-COMMENT')).then(function (ret) {
            //     $scope.dialogData = {details: ret};
            // }); 
            vm.query();
        }

        function syncInterfaceData() {
            ngDialog.openConfirm({
                template: 'normalConfirmDialog.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            }).then(function () {

                vmh.idtService.PFT$Sync_ScenicSpot().then(function(){
                    vmh.alertSuccess();
                });
            });
        }
    }
    
})();
