/**
 * tree.module Created by zppro on 16-9-13.
 * Target:七牛默认图片上传器
 */
(function() {
    'use strict';

    angular
        .module('qiniu-ng')
        .run(qiniuRun);
    ;

    qiniuRun.$inject = ['$templateCache'];

    function qiniuRun($templateCache) {
        var templateContentDefault = '<div id="{{containerId}}">\
                <a class="btn btn-default btn-lg " id="{{buttonId}}" href="#" >\
                <i class="glyphicon glyphicon-plus"></i>\
                <span>{{buttonText}}</span></a></div>';
        $templateCache.put("qiniu-uploader-default.html",templateContentDefault);

        var templateContentPrimarySM = '<div id="{{containerId}}">\
                <a class="btn btn-primary btn-sm " id="{{buttonId}}" href="#" >\
                <i class="glyphicon glyphicon-plus"></i>\
                <span>{{buttonText}}</span></a></div>';
        $templateCache.put("qiniu-uploader-primary-sm.html",templateContentPrimarySM);

    }
})();