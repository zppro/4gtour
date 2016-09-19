/**
 * Created by zppro on 16-9-19.
 */
(function() {
    'use strict';

    angular.module('qiniu-ng')
        .service('qiniuTokenGenerator', qiniuTokenGenerator);

    qiniuTokenGenerator.$inject = ['qiniuNode','$q'];

    function qiniuTokenGenerator(qiniuNode,$q) {

        function getToken(type,user,bucket,key) {
            var self = this;
            this.tokenStorage = this.tokenStorage || {};
            var k = Array.prototype.slice.call(arguments).join();
            if (window.Qiniu) {
                k = window.Qiniu.base64_encode(k);
            }

            console.log(this.tokenStorage);

            if (this.tokenStorage[k]) {
                console.log('get-token-cached');
                return $q.when(this.tokenStorage[k]);
            }

            if (type == 'up') {
                //上传token 
                return qiniuNode.uploadToken(user, bucket, key).then(function (ret) {
                    self.tokenStorage[k] = ret.data.uptoken;
                    return ret.data.uptoken;
                });
            }
            return null;
        }
        
        return {
            getToken: getToken
        };
    }

})();