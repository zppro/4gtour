/**
 * Created by zppro on 16-3-14.
 */
(function() {
    'use strict';

    angular
        .module('app.model')
        .config(modelConfig);

    modelConfig.$inject = ['modelNodeProvider', 'shareNodeProvider','extensionNodeProvider', 'mwsNodeProvider', 'psnDashboardNodeProvider', 'trvDashboardNodeProvider', 'idtNodeProvider','qiniuNodeProvider','debugNodeProvider', 'clientDataProvider'];
    function modelConfig(modelNodeProvider, shareNodeProvider,extensionNodeProvider, mwsNodeProvider, psnDashboardNodeProvider, trvDashboardNodeProvider, idtNodeProvider,qiniuNodeProvider, debugNodeProvider,clientDataProvider) {
        modelNodeProvider.setBaseUrl('services/model/manage/');
        shareNodeProvider.setBaseUrl('services/share/');
        extensionNodeProvider.setBaseUrl('services/extension/');
        mwsNodeProvider.setBaseUrl('services/mws/');
        psnDashboardNodeProvider.setBaseUrl('services/dashboard/psn/');
        trvDashboardNodeProvider.setBaseUrl('services/dashboard/trv/');
        idtNodeProvider.setBaseUrl('services/idt/');

        qiniuNodeProvider.setBaseUrl('services/qiniu/');
        debugNodeProvider.setBaseUrl('debug-services/debug/');
        clientDataProvider.setBaseUrl('server/');
    }
})();