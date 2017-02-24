/**
 * dashboard Created by zppro on 17-1-6.
 * Target:系统管理员以上看的数据面板（俯瞰图）
 */
(function() {
    'use strict';

    angular
        .module('subsystem.merchant-webstore')
        .controller('DashboardMerchantWebstoreController', DashboardMerchantWebstoreController)
    ;

    DashboardMerchantWebstoreController.$inject = ['$scope', 'vmh', 'instanceVM'];

    function DashboardMerchantWebstoreController($scope, vmh, vm) {
        $scope.vm = vm;

        init();

        function init() {

            vm.init();
            
            vm.refreshAccessTokens = function () {
                vmh.blocker.start();
                vmh.mwsService.accessTokens(vm.tenantId).then(function(rows){
                    vm.accessTokens = rows;
                }).finally(function(){
                    vmh.blocker.stop();
                });
            }
            
            vm.requestAccessToken = function (app_id) {
                vmh.blocker.start();
                vmh.mwsService.requestAccessToken(app_id).then(function(){
                    vmh.alertSuccess('notification.NORMAL-SUCCESS', true);
                    vm.refreshAccessTokens();
                }).finally(function(){
                    vmh.blocker.stop();
                });
            }

            vm.refreshAccessTokens();

        }
    }

})();