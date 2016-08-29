/**
 * Created by zppro on 16-3-15.
 */

(function() {
    'use strict';

    angular
        .module('app.pages')
        .controller('LockFormController', LockFormController);

    LockFormController.$inject = ['$scope','$http', '$state','Auth'];
    function LockFormController($scope,$http, $state,Auth) {
        var vm = this;

        activate();

        ////////////////

        function activate() {
            // place the message if something goes wrong
            vm.authMsg = '';
            vm.email = Auth.getCode();
            vm.unlock = function () {
                vm.authMsg = '';

                if (vm.lockForm.$valid) {

                    $http
                        .post('services/share/login/signin', {code: vm.email, password: vm.password})
                        .then(function (user) {
                            // assumes if ok, response is an object with some data, if not, a string with error
                            // customize according to your api
                            console.log(user);
                            Auth.setUser(user,true);
                            $state.go('app.dashboard');
                        }, function (err) {
                            vm.authMsg = err;
                        });

                }
                else {
                    // set as dirty if the user click directly to login so we show the validation messages
                    /*jshint -W106*/
                    vm.lockForm.lock_password.$dirty = true;
                }
            };


        }
    }
})();
