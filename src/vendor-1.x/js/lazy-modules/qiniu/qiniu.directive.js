(function() {
    'use strict';

    angular
        .module('app.qiniu')
        .directive('qiniuUploader', qiniuUploader);

    qiniuUploader.$inject = ['$timeout', '$q',$templateRequest];
    function qiniuUploader ($timeout, $q,$templateRequest) {

        var directive = {
            restrict: 'A',
            link: link
        };
        return directive;

        ///////

        function link(scope, el) {

            var templateUrl = attrs.qiniuUploaderTemplateUrl || 'qiniu-uploader-default.html';
            $templateRequest(templateUrl).then(function(htmlStr){
                var template = angular.element(htmlStr);
                $compile(template)(scope);

            });


        } //link
    }

})();