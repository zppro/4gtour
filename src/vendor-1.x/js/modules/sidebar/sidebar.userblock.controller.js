(function() {
    'use strict';

    angular
        .module('app.sidebar')
        .controller('UserBlockController', UserBlockController);

    UserBlockController.$inject = ['$rootScope','Auth','ngDialog'];
    function UserBlockController($rootScope,Auth,ngDialog) {

        activate();

        ////////////////

        function activate() {
            $rootScope.user = _.defaults(Auth.getUser(), {
                picture: 'app/img/user/04.jpg'
            });

            // Hides/show user avatar on sidebar
            $rootScope.toggleUserBlock = function () {

                $rootScope.$broadcast('toggleUserBlock');
            };

            $rootScope.userBlockVisible = true;

            if(!$rootScope.toggleUserListener) {
                $rootScope.toggleUserListener = $rootScope.$on('toggleUserBlock', function (/*event, args*/) {
                    $rootScope.userBlockVisible = !$rootScope.userBlockVisible;

                });
            }

            $rootScope.userChangePassword = function() {
                ngDialog.open({
                    template: 'changePasswordByUser.html',
                    controller: 'UserChangePasswordController'
                });
            }

        }
    }
})();
