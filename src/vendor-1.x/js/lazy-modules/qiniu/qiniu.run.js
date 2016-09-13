/**
 * tree.module Created by zppro on 16-9-13.
 * Target:七牛默认图片上传器
 */
(function() {
    'use strict';

    angular
        .module('app.qiniu')
        .run(qiniuRun);
    ;

    qiniuRun.$inject = ['$templateCache'];

    function qiniuRun($templateCache) {
        var templateContent = '<div id="#container-id#">\
                <a class="btn btn-default btn-lg " id="#button-id#" href="#" >\
                <i class="glyphicon glyphicon-plus"></i>\
                <span>#button-text#</span></a></div>';
        $templateCache.put("qiniu-uploader-default.html",templateContent);

    }
})();