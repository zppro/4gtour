/**
 * Created by zppro on 16-3-14.
 */
(function() {
    'use strict';

    angular.module('app.auth')
        .service('Auth', Auth);

    Auth.$inject = ['$window','$cookieStore'];

    function Auth($window,$cookieStore) {
        //var _user = $cookieStore.get('user');
        var _user = angular.fromJson($window.localStorage.getItem('user'));
        var setUser = function (user, rememberCode) {
            _user = user;
            if (_user.roles && _user.roles.length > 0) {
                _user.role = 0;
                _.each(_user.roles, function (o) {
                    _user.role += parseInt(o);
                });
            }
            //$cookieStore.put('user', _user);
            $window.localStorage.setItem('user', angular.toJson(_user));
            if (rememberCode) {
                //$cookieStore.put('code', _user.code);
                $window.localStorage.setItem('code', _user.code);
            }
            else {
                //$cookieStore.remove("code");
                $window.localStorage.removeItem('code', _user.code);

            }
        };
        var _open_funcs = angular.fromJson($window.localStorage.getItem('open_funcs'));
        var setOpenFuncs = function (open_funcs, rememberCode) {
            _open_funcs = open_funcs;
            $window.localStorage.setItem('open_funcs', angular.toJson(_open_funcs));
        };
        var _token = $cookieStore.get('token');
        var setToken = function (token) {
            _token = token;
            $cookieStore.put('token', _token);
        };
        return {
            setUser: setUser,
            setOpenFuncs: setOpenFuncs,
            setToken: setToken,
            isAuthorized: function (lvl) {
                //调试时可以在此切换默认用户角色
                return ((_user || {}).role || 1) >= lvl;
            },
            isPermit: function (func_id) {
                this.ensureUser();
                if (_user) {
                    if(_user.tenant && _user.type=='A0002' && _open_funcs){
                        //机构用户
                        var func = _.find(_open_funcs, function (o) {
                            return o.func_id == func_id;
                        });

                        if (func) {
                            if (_user.tenant.limit_to > 0) {
                                return true;
                            }
                            else { 
                                return angular.isDefined(moment) && moment(func.expired_on).diff(moment()) >= 0;
                            }
                        }
                        else {
                            return false;
                        }
                    }
                    //平台用户
                    return true;
                }
                return false;
            },
            isAuthenticated: function () {
                return _token && _user ? true : false;
            },
            getUser: function () {
                this.ensureUser();
                return _user;
            },
            getToken: function () {
                return _token || '';
            },
            setCode: function () {
                $window.localStorage.setItem('code', _user.code);
            },
            getCode: function () {
                //return $cookieStore.get('code') || (_user || {code: null}).code;
                return $window.localStorage.getItem('code');
            },
            logout: function () {
                //$cookieStore.remove('user');
                $window.localStorage.removeItem('user');
                _user = null;
            },
            ensureUser: function () {
                //_user = _user || $cookieStore.get('user');
                _user = _user || angular.fromJson($window.localStorage.getItem('user'));
            }
        };
    }

})();