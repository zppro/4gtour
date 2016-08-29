(function() {
    'use strict';

    angular
        .module('app.core')
        .config(coreConfig);

    coreConfig.$inject = ['$controllerProvider', '$compileProvider', '$filterProvider', '$provide','$animateProvider','datepickerConfig', 'datepickerPopupConfig','blockUIConfig'];
    function coreConfig($controllerProvider, $compileProvider, $filterProvider, $provide,$animateProvider,datepickerConfig,datepickerPopupConfig,blockUIConfig) {

        var core = angular.module('app.core');
        // registering components after bootstrap
        core.controller = $controllerProvider.register;
        core.directive = $compileProvider.directive;
        core.filter = $filterProvider.register;
        core.factory = $provide.factory;
        core.service = $provide.service;
        core.constant = $provide.constant;
        core.value = $provide.value;

        $animateProvider.classNameFilter(/^((?!(repeat-modify)).)*$/)


        datepickerConfig.startingDay = 1;
        datepickerConfig.showWeeks = false;

        datepickerPopupConfig.datepickerPopup = "yyyy-MM-dd";
        datepickerPopupConfig.currentText = "今天";
        datepickerPopupConfig.clearText = "清除";
        datepickerPopupConfig.closeText = "关闭";

        blockUIConfig.autoInjectBodyBlock = false;
        blockUIConfig.delay = 0;
    }

})();