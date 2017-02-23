/**
 * Created by zppro on 16-3-15.
 */
(function() {
    'use strict';

    angular
        .module('app.core')
        .controller('AppController', AppController)
        .controller('TopbarController', TopbarController)
        .controller('DashboardDispatcherController',DashboardDispatcherController)
        .controller('ModuleHeaderController', ModuleHeaderController)
        .controller('ModuleHeaderForTenantController', ModuleHeaderForTenantController)
    ;

    AppController.$inject = ['$rootScope','Auth'];
    function AppController($rootScope){
        //console.log(window.navigator.userLanguage || window.navigator.language);
        moment.locale($rootScope.localeId.replace('_','-').toLowerCase());
    }

    TopbarController.$inject = ['$rootScope','Auth','SettingsManager'];

    function TopbarController($rootScope, Auth,SettingsManager) {

        activate();

        function activate() {

            //topbar some actions
            $rootScope.app.logout = function ($event) {
                Auth.logout();
                var settings = SettingsManager.getInstance();
                settings && settings.clear();
                $rootScope.$state.go('page.login');
                $event.stopPropagation();
            };

            $rootScope.app.lock = function ($event) {
                //Auth.setCode();
                Auth.logout();
                $rootScope.$state.go('page.lock');
                $event.stopPropagation();
            };

            $rootScope.app.fullScreen = function ($event) {
                $rootScope.app.isFullScreen = true;
                var el = document.documentElement;
                var rfs = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullScreen;
                if (typeof rfs != "undefined" && rfs) {
                    rfs.call(el);
                } else if(typeof window.ActiveXObject != "undefined"){
                    var wscript = new ActiveXObject("WScript.Shell");
                    if (wscript!=null) {
                        wscript.SendKeys("{F11}");
                    }
                }
                $event.stopPropagation();
            }
            $rootScope.app.exitFullScreen = function ($event) {
                $rootScope.app.isFullScreen = false;
                var efs = document.exitFullscreen || document.webkitCancelFullScreen || document.mozCancelFullScreen || document.msExitFullscreen;
                console.log(efs)
                if (typeof efs != "undefined" && efs) {
                    efs.call(document)
                } else if(typeof window.ActiveXObject != "undefined"){
                    var wscript = new ActiveXObject("WScript.Shell");
                    if (wscript!=null) {
                        wscript.SendKeys("{F11}");
                    }
                }
                $event.stopPropagation();
            }

        }
    }

    DashboardDispatcherController.$inject = ['$rootScope','SETTING_KEYS','SettingsManager'];
    function DashboardDispatcherController($rootScope,SETTING_KEYS,SettingsManager) {
        //console.log('$rootScope.currentSubsystemSref:'+$rootScope.currentSubsystemSref);
        
        var settings = SettingsManager.getInstance();
        var currentSystem = settings && settings.read(SETTING_KEYS.CURRENT_SUBSYSTEM);
        console.log(currentSystem);
        if (currentSystem) {
            $rootScope.$state.go(currentSystem.sref + '.dashboard');
        }
        else{
            console.log('no currentSubsystemSref');
        }
    }

    ModuleHeaderController.$inject = ['$scope','vmh'];
    function ModuleHeaderController($scope,vmh) {
        $scope.vmh = vmh;
    }

    ModuleHeaderForTenantController.$inject = ['$scope','vmh','Auth'];
    function ModuleHeaderForTenantController($scope,vmh,Auth) {
        $scope.vmh = vmh;
        var vm = $scope.vm = {};
        var user = Auth.getUser();
        if(user && user.tenant) {
            vm.tenantName = user.tenant.name;
        }
    }
})();
