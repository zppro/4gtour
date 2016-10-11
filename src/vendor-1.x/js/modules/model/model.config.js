/**
 * Created by zppro on 16-3-14.
 */
(function() {
    'use strict';

    angular
        .module('app.model')
        .config(modelConfig);

    modelConfig.$inject = ['modelNodeProvider', 'shareNodeProvider','extensionNodeProvider','extOfOrganizationOfTravelNodeProvider','idtNodeProvider','extensionOfDashboardOfTenantNodeProvider','qiniuNodeProvider','debugNodeProvider', 'clientDataProvider'];
    function modelConfig(modelNodeProvider, shareNodeProvider,extensionNodeProvider,extOfOrganizationOfTravelNodeProvider,idtNodeProvider,extensionOfDashboardOfTenantNodeProvider,qiniuNodeProvider, debugNodeProvider,clientDataProvider) {
        modelNodeProvider.setBaseUrl('services/model/manage/');
        shareNodeProvider.setBaseUrl('services/share/');
        extensionNodeProvider.setBaseUrl('services/extension/');
        extOfOrganizationOfTravelNodeProvider.setBaseUrl('services/ext/organizationOfTravel/');
        idtNodeProvider.setBaseUrl('services/idt/');
        extensionOfDashboardOfTenantNodeProvider.setBaseUrl('services/ext/dashboardOfTenant/');
        qiniuNodeProvider.setBaseUrl('services/qiniu/');
        debugNodeProvider.setBaseUrl('debug-services/debug/');
        clientDataProvider.setBaseUrl('server/');
    }
})();