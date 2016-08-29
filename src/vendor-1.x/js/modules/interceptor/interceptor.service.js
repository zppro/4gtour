/**
 * Created by zppro on 16-3-21.
 */
(function() {
    'use strict';

    angular.module('app.interceptor')
        .factory('globalInterceptor', globalInterceptor)
    ;

    globalInterceptor.$inject = ['$q', '$rootScope','$translate','Auth','Notify'];

    function globalInterceptor($q, $rootScope,$translate,Auth,Notify) {

        return {
            'request': function (req) {
                var _url = req.url.toLowerCase();

                if (_url.indexOf('services/') == 0 && _url !== 'services/share/login/signin') {
                    //console.log(_url);
                    //console.log(req.headers);
                    req.headers.Authorization = Auth.getToken();
                }
                return req;
            },
            'response': function (resp) {

                var _url = resp.config.url.toLowerCase();
                if (_url.indexOf('services/') == 0) {
                    if (resp.data.success) {
                        //console.log(resp.data);
                        //console.log(resp.headers());

                        if (resp.config.headers._$resource$_) {
                            //console.log(resp.headers()['page-totals']);
                            //console.log('resp.config.headers._$resource$_:true')
                            resp.data = resp.data.rows || resp.data.ret;
                        }
                        else {
                            return resp.data.rows || resp.data.ret;
                        }
                    }
                    else {
                        $rootScope.$broadcast('server:500', resp.data.msg);
                        return $q.reject(resp.data.msg);
                    }
                }
                return resp;
            },
            'responseError': function (rejection) {
                // 错误处理
                switch (rejection.status) {
                    case 401:
                        $rootScope.$broadcast('auth:401');
                        break;
                    case 403:
                        $rootScope.$broadcast('auth:403');
                        break;
                    case 404:
                        $rootScope.$broadcast('page:404');
                        break;
                    case 500:
                        $rootScope.$broadcast('server:500');
                        break;
                }
                return $q.reject(rejection);
            }
        };
    }


})();