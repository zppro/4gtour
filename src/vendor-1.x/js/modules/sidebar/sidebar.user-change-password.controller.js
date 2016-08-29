/**=========================================================
 * Module: sidebar-menu.js
 * Handle sidebar collapsible elements
 =========================================================*/

(function() {
    'use strict';

    angular
        .module('app.sidebar')
        .controller('UserChangePasswordController', UserChangePasswordController);

    UserChangePasswordController.$inject = ['$scope','$q','$translate','ViewUtils','extensionNode','Auth','Notify'];
    function UserChangePasswordController($scope,$q,$translate,ViewUtils,extensionService,Auth,Notify) {

        $scope.utils = ViewUtils;
        var vm = $scope.vm = {};

        init();

        function init() {
            vm.doSubmit = doSubmit;
        }

        function doSubmit() {

            if ($scope.theForm.$valid) {
                var currentUser = Auth.getUser();

                return $q.all([$translate('notification.SAVE-SUCCESS'), extensionService.userChangePassword(currentUser._id, vm.model)]).then(function (ret) {
                    console.log(ret);
                    console.log(3);
                    Notify.alert('<div class="text-center"><em class="fa fa-check"></em> ' + ret[0] + '</div>', 'success');
                    $scope.closeThisDialog();
                }).catch(function (err) {
                    vm.errorMsg = err;
                });
            }
        }
    }

})();
