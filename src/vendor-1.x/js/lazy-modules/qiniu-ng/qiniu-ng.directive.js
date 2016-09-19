(function() {
    'use strict';

    angular
        .module('qiniu-ng')
        .directive('qiniuUploader', qiniuUploader);

    function genContainerId() {
        return Math.random().toString(36).substr(2, 9);
    }

    qiniuUploader.$inject = ['$timeout', '$q','$templateRequest','$compile','qiniuTokenGenerator'];
    function qiniuUploader ($timeout, $q,$templateRequest,$compile,qiniuTokenGenerator) {

        var directive = {
            restrict: 'A',
            scope: {ngUploadedUrl: '=',user:'=',bucket:'@'},
            link: link
        };
        return directive;

        ///////

        function link(scope, el,attrs) {

            scope.containerId = attrs.containerId || genContainerId();
            scope.buttonId = attrs.buttonId || scope.containerId + '-button';
            scope.buttonText = attrs.buttonText || 'Select files';

            scope.ngUploadedUrl = 'xyz';

            var templateUrl = attrs.qiniuUploaderTemplateUrl || 'qiniu-uploader-default.html';
            $templateRequest(templateUrl).then(function(htmlStr){
                var template = angular.element(htmlStr);
                angular.element(el).html(template);
                $compile(template)(scope);

                qiniuTokenGenerator.getToken('up',scope.user,scope.bucket).then(function(token){
                    $timeout(function () {
                        initUploader(token);
                    });

                });
            });

            function initUploader(uploadToken){

                var uploader = Qiniu.uploader({
                    runtimes: 'html5,flash,html4',    //上传模式,依次退化
                    browse_button: scope.buttonId,       //上传选择的点选按钮，**必需**
                    //uptoken_url: '/services/qiniu/uploadToken/4gimg/test/123',            //Ajax请求upToken的Url，**强烈建议设置**（服务端提供）
                    uptoken : uploadToken, //若未指定uptoken_url,则必须指定 uptoken ,uptoken由其他程序生成
                    unique_names: true, // 默认 false，key为文件名。若开启该选项，SDK为自动生成上传成功后的key（文件名）。
                    // save_key: true,   // 默认 false。若在服务端生成uptoken的上传策略中指定了 `sava_key`，则开启，SDK会忽略对key的处理
                    domain: 'http://ocg0av72h.bkt.clouddn.com/',   //bucket 域名，下载资源时用到，**必需**
                    get_new_uptoken: false,  //设置上传文件的时候是否每次都重新获取新的token
                    container: scope.containerId,           //上传区域DOM ID，默认是browser_button的父元素，
                    max_file_size: '100mb',           //最大文件体积限制
                    flash_swf_url: '/vendor/plupload/js/Moxie.swf',  //引入flash,相对路径
                    max_retries: 3,                   //上传失败最大重试次数
                    dragdrop: true,                   //开启可拖曳上传
                    drop_element: scope.containerId,        //拖曳上传区域元素的ID，拖曳文件或文件夹后可触发上传
                    chunk_size: '4mb',                //分块上传时，每片的体积
                    auto_start: true,                 //选择文件后自动上传，若关闭需要自己绑定事件触发上传
                    init: {
                        'FileUploaded': function(up, file, info) {
                            // 每个文件上传成功后,处理相关的事情
                            var domain = up.getOption('domain');
                            var res = angular.fromJson(info);
                            var sourceLink = domain + res.key; //获取上传成功后的文件的Url
                            $timeout(function(){
                                scope.ngUploadedUrl = sourceLink;
                            });
                        },
                        'Error': function(up, err, errTip) {
                            //上传出错时,处理相关的事情
                            console.log(errTip);
                        }
                    }
                });
            }
        } //link
    }

})();