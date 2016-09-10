/**
 * Created by zppro on 16-8-28.
 */
var _ = require('underscore');
var jwt = require('jsonwebtoken');


module.exports = function (app){
    var ignoreAuthPaths = app.conf.auth.ignorePaths;
    return function * (next) {
        var self = this;
        var isIgnored = false;
        if(ignoreAuthPaths){
            _.each(ignoreAuthPaths,function(o){
               if(self.path.startsWith(o)) {
                   isIgnored = true;
                   return false;
               }
            });
        }
        if(!isIgnored){
            var token = this.get("Authorization");
            if (token === undefined) {
                this.status = 401;
                return;
            }
            else if (token === '') {
                this.status = 401;
                return;
            }

            try {
                this.user = jwt.verify(token, app.conf.secure.authSecret + ':' + (new Date().f('yyyy-MM-dd').toString()));
            }catch(e){
                this.status = 401;
                return;
            }
        }


        yield next;
    };
};