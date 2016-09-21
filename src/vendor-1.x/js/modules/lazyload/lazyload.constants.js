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
                'echarts.common': ['vendor/echarts/dist/echarts.common.min.js'],
                'qiniu':['vendor/plupload/js/plupload.full.min.js','vendor/plupload/js/i18n/zh_CN.js','vendor/qiniu/dist/qiniu.js'],
                'qiniu2':['vendor/plupload/js/moxie.js','vendor/plupload/js/plupload.dev.js','vendor/plupload/js/i18n/zh_CN.js','vendor/qiniu/dist/qiniu.js']
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
                {name: 'echarts-ng', files: ['vendor/echarts-ng/dist/echarts-ng.min.js']},
                {name:'qiniu-ng',files:['app/js/lazy-modules/qiniu-ng.js']},
                {name:'app.demo',files:['app/js/lazy-modules/demo.js']},
                {name:'subsystem.manage-center', files: ['app/css/manage-center.css']},
                {name:'subsystem.manage-center.dashboard.js',files:['app/js/lazy-modules/manage-center/dashboard.js']},
                {name:'subsystem.manage-center.tenant-account-manage.js',files:['app/js/lazy-modules/manage-center/tenant-account-manage.js']},
                {name:'subsystem.manage-center.tenant-order-manage.js',files:['app/js/lazy-modules/manage-center/tenant-order-manage.js']},
                {name:'subsystem.manage-center.tenant-user-manage.js',files:['app/js/lazy-modules/manage-center/tenant-user-manage.js']},
                {name:'subsystem.manage-center.func.js',files:['app/js/lazy-modules/manage-center/func.js']},
                {name:'subsystem.manage-center.order-receipt-confirmation.js',files:['app/js/lazy-modules/manage-center/order-receipt-confirmation.js']},
                {name:'subsystem.manage-center.order-refund-confirmation.js',files:['app/js/lazy-modules/manage-center/order-refund-confirmation.js']},
                {name:'subsystem.organization-travel',files:['app/js/lazy-modules/organization-travel-share.js','app/css/organization-travel.css']},
                {name:'subsystem.organization-travel.dashboard.js',files:['app/js/lazy-modules/organization-travel/dashboard.js']},
                {name:'subsystem.organization-travel.scenic-spot.js',files:['app/js/lazy-modules/organization-travel/scenic-spot.js']},
                {name:'subsystem.organization-travel.user-manage.js',files:['app/js/lazy-modules/organization-travel/user-manage.js']},
                {name:'subsystem.organization-travel.financial-org-receipts-and-disbursements-details.js',files:['app/js/lazy-modules/organization-travel/financial-org-receipts-and-disbursements-details.js']}
            ]
        })
    ;

})();
