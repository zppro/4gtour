(function() {
    'use strict';

    angular
        .module('qiniu-ng')
        .directive('qiniuUploader', qiniuUploader);

    function genContainerId() {
        return Math.random().toString(36).substr(2, 9);
    }

    qiniuUploader.$inject = ['$timeout', '$q','$templateRequest','$compile'];
    function qiniuUploader ($timeout, $q,$templateRequest,$compile) {

        var directive = {
            restrict: 'A',
            link: link
        };
        return directive;

        ///////

        function link(scope, el,attrs) {

            console.log(123);
            scope.containerId = attrs.containerId || genContainerId;
            var templateUrl = attrs.qiniuUploaderTemplateUrl || 'qiniu-uploader-default.html';
            $templateRequest(templateUrl).then(function(htmlStr){
                var template = angular.element(htmlStr);
                $compile(template)(scope);

            });

            console.log(scope);

        } //link
    }

})();