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
                'file-saver': ['vendor/file-saver/FileSaver.min.js'],
                'socket.io-client': ['vendor/socket.io-client/dist/socket.io.min.js']
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
                {name:'subsystem.shared.red.js',files:['app/js/lazy-modules/shared/red.js']},
                {name:'subsystem.shared.receipts-and-disbursements.js',files:['app/js/lazy-modules/shared/receipts-and-disbursements.js']},
                {name:'subsystem.shared.user-manage.js',files:['app/js/lazy-modules/shared/user-manage.js']},
                {name:'subsystem.shared.wxa-config.js',files:['app/js/lazy-modules/shared/wxa-config.js']},
                {name:'subsystem.shared.charge-standard.js',files:['app/js/lazy-modules/shared/charge-standard.js']},
                {name:'subsystem.shared.charge-item-customized.js',files:['app/js/lazy-modules/shared/charge-item-customized.js']},
                {name:'subsystem.shared.robot.js',files:['app/js/lazy-modules/shared/robot.js']},
                {name:'subsystem.shared.bed-monitor.js',files:['app/js/lazy-modules/shared/bed-monitor.js']},
                {name:'subsystem.merchant-webstore.dashboard.js',files:['app/js/lazy-modules/merchant-webstore/dashboard.js']},
                {name:'subsystem.merchant-webstore.spu.js',files:['app/js/lazy-modules/merchant-webstore/spu.js']},
                {name:'subsystem.merchant-webstore.order.js',files:['app/js/lazy-modules/merchant-webstore/order.js']},
                {name:'subsystem.merchant-webstore.after-sale.js',files:['app/js/lazy-modules/merchant-webstore/after-sale.js']},
                {name:'subsystem.merchant-webstore.channel-unit.js',files:['app/js/lazy-modules/merchant-webstore/channel-unit.js']},
                {name:'subsystem.merchant-webstore.wx-app-config.js',files:['app/js/lazy-modules/merchant-webstore/wx-app-config.js']},
                {name:'subsystem.pension-agency.',files:['app/js/lazy-modules/pension-agency-share.js','app/css/pension-agency.css']},
                {name:'subsystem.pension-agency.dashboard.js',files:['app/js/lazy-modules/pension-agency/dashboard.js']},
                {name:'subsystem.pension-agency.enter.js',files:['app/js/lazy-modules/pension-agency/enter.js']},
                {name:'subsystem.pension-agency.in.js',files:['app/js/lazy-modules/pension-agency/in.js']},
                {name:'subsystem.pension-agency.exit.js',files:['app/js/lazy-modules/pension-agency/exit.js']},
                {name:'subsystem.pension-agency.reception.js',files:['app/js/lazy-modules/pension-agency/reception.js']},
                {name:'subsystem.pension-agency.leave.js',files:['app/js/lazy-modules/pension-agency/leave.js']},
                {name:'subsystem.pension-agency.nursing-station.js',files:['app/js/lazy-modules/pension-agency/nursing-station.js']},
                {name:'subsystem.pension-agency.nursing-plan.js',files:['app/js/lazy-modules/pension-agency/nursing-plan.js']},
                {name:'subsystem.pension-agency.nursing-schedule.js',files:['app/js/lazy-modules/pension-agency/nursing-schedule.js']},
                {name:'subsystem.pension-agency.nursing-schedule-template.js',files:['app/js/lazy-modules/pension-agency/nursing-schedule-template.js']},
                {name:'subsystem.pension-agency.enter-payment.js',files:['app/js/lazy-modules/pension-agency/enter-payment.js']},
                {name:'subsystem.pension-agency.recharge.js',files:['app/js/lazy-modules/pension-agency/recharge.js']},
                {name:'subsystem.pension-agency.exit-settlement.js',files:['app/js/lazy-modules/pension-agency/exit-settlement.js']},
                {name:'subsystem.pension-agency.drug-directory.js',files:['app/js/lazy-modules/pension-agency/drug-directory.js']},
                {name:'subsystem.pension-agency.drug-stock.js',files:['app/js/lazy-modules/pension-agency/drug-stock.js']},
                {name:'subsystem.pension-agency.drug-in-stock.js',files:['app/js/lazy-modules/pension-agency/drug-in-stock.js']},
                {name:'subsystem.pension-agency.exit-item-return.js',files:['app/js/lazy-modules/pension-agency/exit-item-return.js']},
                {name:'subsystem.pension-agency.nursing-worker.js',files:['app/js/lazy-modules/pension-agency/nursing-worker.js']},
                {name:'subsystem.pension-agency.work-item.js',files:['app/js/lazy-modules/pension-agency/work-item.js']},
                {name:'subsystem.pension-agency.room.js',files:['app/js/lazy-modules/pension-agency/room.js']},
                {name:'subsystem.pension-agency.district.js',files:['app/js/lazy-modules/pension-agency/district.js']},
                {name:'subsystem.pension-agency.nursing-level.js',files:['app/js/lazy-modules/pension-agency/nursing-level.js']},
                {name:'subsystem.health-center.dashboard.js',files:['app/js/lazy-modules/health-center/dashboard.js']},
                {name:'subsystem.organization-travel.dashboard.js',files:['app/js/lazy-modules/organization-travel/dashboard.js']},
                {name:'subsystem.organization-travel.scenery-spot.js',files:['app/js/lazy-modules/organization-travel/scenery-spot.js']},
                {name:'subsystem.organization-travel.scenic-spot.js',files:['app/js/lazy-modules/organization-travel/scenic-spot.js']},
                {name:'subsystem.organization-travel.ticket.js',files:['app/js/lazy-modules/organization-travel/ticket.js']},
                {name:'subsystem.organization-travel.order.js',files:['app/js/lazy-modules/organization-travel/order.js']},
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
                {name:'subsystem.demo-center.',files:['app/js/lazy-modules/demo-center/demo.js']}
            ]
        })
    ;

})();
