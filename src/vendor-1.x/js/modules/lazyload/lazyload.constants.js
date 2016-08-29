(function() {
    'use strict';

    angular
        .module('app.lazyload')
        .constant('APP_REQUIRES', {
            // not angular based script and standalone scripts
            scripts: {
                'modernizr': ['vendor/modernizr/modernizr.js'],
                'icons': ['vendor/fontawesome/css/font-awesome.min.css',
                    'vendor/simple-line-icons/css/simple-line-icons.css'],
                'classyloader':       ['vendor/jquery-classyloader/js/jquery.classyloader.min.js'],
                'eonasdan-bootstrap-datetimepicker': ['vendor/eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.min.css',
                    'vendor/eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min.js'],
                'echarts.simple': ['vendor/echarts/dist/echarts.simple.js'],
                'echarts.common': ['vendor/echarts/dist/echarts.common.js'],
                'echarts': ['vendor/echarts/dist/echarts.js']
            },
            // Angular based script (use the right module name)
            modules: [
                {
                    name: 'ui.select', files: ['vendor/ui-select/dist/select.js',
                    'vendor/ui-select/dist/select.css']
                },
                {
                    name: 'angularjs-slider', files: ['vendor/angularjs-slider/dist/rzslider.js',
                    'vendor/angularjs-slider/dist/rzslider.css']
                },
                {
                    name: 'angucomplete-alt', files: ['vendor/angucomplete-alt/angucomplete-alt.js',
                    'vendor/angucomplete-alt/angucomplete-alt.css']
                },
                {
                    name: 'ngDialog', files: ['vendor/ng-dialog/js/ngDialog.min.js',
                    'vendor/ng-dialog/css/ngDialog.min.css',
                    'vendor/ng-dialog/css/ngDialog-theme-default.min.css']
                },
                {name: 'locale_zh-cn', files: ['vendor/angular-i18n/angular-locale_zh-cn.js']},
                {name: 'echarts-ng', files: ['vendor/echarts-ng/dist/echarts-ng.js']},
                {name: 'subsystem.manage-center', files: ['app/css/manage-center.css']},
                {name: 'subsystem.organization-pfta', files: ['app/css/organization-pfta.css']}
            ]
        })
    ;

})();
