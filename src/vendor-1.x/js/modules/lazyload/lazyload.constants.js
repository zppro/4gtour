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
                'qiniu':['vendor/plupload/js/plupload.full.min.js','vendor/plupload/js/i18n/zh_CN.js','vendor/qiniu/dist/qiniu.min.js'],
                'file-saver': ['vendor/file-saver/FileSaver.min.js']
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
                {name:'subsystem.shared.user-manage.js',files:['app/js/lazy-modules/shared/user-manage.js']},
                {name:'subsystem.shared.wxa-config.js',files:['app/js/lazy-modules/shared/wxa-config.js']},
                {name:'subsystem.shared.charge-standard.js',files:['app/js/lazy-modules/shared/charge-standard.js']},
                {name:'subsystem.shared.charge-item-customized.js',files:['app/js/lazy-modules/shared/charge-item-customized.js']},
                {name:'subsystem.merchant-webstore.dashboard.js',files:['app/js/lazy-modules/merchant-webstore/dashboard.js']},
                {name:'subsystem.merchant-webstore.spu.js',files:['app/js/lazy-modules/merchant-webstore/spu.js']},
                {name:'subsystem.merchant-webstore.order.js',files:['app/js/lazy-modules/merchant-webstore/order.js']},
                {name:'subsystem.merchant-webstore.after-sale.js',files:['app/js/lazy-modules/merchant-webstore/after-sale.js']},
                {name:'subsystem.merchant-webstore.channel-unit.js',files:['app/js/lazy-modules/merchant-webstore/channel-unit.js']},
                {name:'subsystem.merchant-webstore.wx-app-config.js',files:['app/js/lazy-modules/merchant-webstore/wx-app-config.js']},
                {name:'subsystem.pension-agency.',files:['app/js/lazy-modules/pension-agency-share.js','app/css/pension-agency.css']},
                {name:'subsystem.pension-agency.dashboard.js',files:['app/js/lazy-modules/pension-agency/dashboard.js']},
                {name:'subsystem.pension-agency.room.js',files:['app/js/lazy-modules/pension-agency/room.js']},
                {name:'subsystem.pension-agency.district.js',files:['app/js/lazy-modules/pension-agency/district.js']},
                {name:'subsystem.health-center.dashboard.js',files:['app/js/lazy-modules/health-center/dashboard.js']},
                {name:'subsystem.organization-travel.dashboard.js',files:['app/js/lazy-modules/organization-travel/dashboard.js']},
                {name:'subsystem.organization-travel.scenery-spot.js',files:['app/js/lazy-modules/organization-travel/scenery-spot.js']},
                {name:'subsystem.organization-travel.scenic-spot.js',files:['app/js/lazy-modules/organization-travel/scenic-spot.js']},
                {name:'subsystem.organization-travel.ticket.js',files:['app/js/lazy-modules/organization-travel/ticket.js']},
                {name:'subsystem.organization-travel.order.js',files:['app/js/lazy-modules/organization-travel/order.js']},
                {name:'subsystem.organization-travel.financial-org-receipts-and-disbursements-details.js',files:['app/js/lazy-modules/organization-travel/financial-org-receipts-and-disbursements-details.js']},
                {name:'subsystem.manage-center.', files: ['app/css/manage-center.css']},
                {name:'subsystem.manage-center.dashboard.js',files:['app/js/lazy-modules/manage-center/dashboard.js']},
                {name:'subsystem.manage-center.tenant-account-manage.js',files:['app/js/lazy-modules/manage-center/tenant-account-manage.js']},
                {name:'subsystem.manage-center.tenant-order-manage.js',files:['app/js/lazy-modules/manage-center/tenant-order-manage.js']},
                {name:'subsystem.manage-center.tenant-user-manage.js',files:['app/js/lazy-modules/manage-center/tenant-user-manage.js']},
                {name:'subsystem.manage-center.func.js',files:['app/js/lazy-modules/manage-center/func.js']},
                {name:'subsystem.manage-center.order-receipt-confirmation.js',files:['app/js/lazy-modules/manage-center/order-receipt-confirmation.js']},
                {name:'subsystem.manage-center.order-refund-confirmation.js',files:['app/js/lazy-modules/manage-center/order-refund-confirmation.js']},
                {name:'subsystem.manage-center.app-serverside-update.js',files:['app/js/lazy-modules/manage-center/app-serverside-update.js']},
                {name:'subsystem.manage-center.app-clientside-update.js',files:['app/js/lazy-modules/manage-center/app-clientside-update.js']},
                {name:'subsystem.demo-center.',files:['app/js/lazy-modules/demo.js']}
            ]
        })
    ;

})();
