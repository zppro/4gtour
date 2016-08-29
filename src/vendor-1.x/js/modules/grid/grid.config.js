/**
 * Created by zppro on 16-2-29.
 */
(function() {
    'use strict';

    angular
        .module('app.grid')
        .config(gridConfig);

    gridConfig.$inject = ['paginationConfig','pagerConfig'];
    function gridConfig(paginationConfig, pagerConfig){

        paginationConfig.firstText = "首页";
        paginationConfig.previousText = '上页';
        paginationConfig.nextText = '下页';
        paginationConfig.lastText = '尾页';

        pagerConfig.previousText = "« 上页";
        pagerConfig.nextText = "下页 »";

    }
})();