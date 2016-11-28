/**
 * Created by zppro on 16-8-28.
 */
var _ = require('underscore');
var jwt = require('jsonwebtoken');


module.exports = function (app){
    var ignoreAuthPaths = app.conf.authApp.ignorePaths;
    return function * (next) {
        // console.log('authApp');
        var self = this;
        var isIgnored = false;
        if(ignoreAuthPaths) { 
            _.each(ignoreAuthPaths, function (o) {
                if(app._.isString(o)) {
                    if (self.path.toLowerCase().startsWith(o.toLowerCase().replace(/\$/, '\\$'))) {
                        isIgnored = true;
                        return false;
                    }
                }
                else if(app._.isObject(o)) {
                    if (self.path.toLowerCase().startsWith(o.path.toLowerCase().replace(/\$/, '\\$'))
                        && self.method.toLowerCase() == o.method.toLowerCase()) {
                        isIgnored = true;
                        return false;
                    }
                }
            });
        }
        if(!isIgnored){
            if(this.method != 'OPTIONS'){
                var token = this.get("Authorization");
                if (token === undefined) {
                    this.status = 401;
                    return;
                }
                else if (token === '') {
                    this.status = 401;
                    return;
                }
                else if(token.indexOf('Bearer ') != 0){
                    this.status = 401;
                    return;
                }
                
                try {
                    token = token.substr('Bearer '.length)
                    var timestamp = this.get('X-Custom-TS');
                    this.request_timestamp = timestamp;
                    this.payload = jwt.verify(token, app.conf.secure.authSecret + ':' + timestamp);

                    // console.log(this.payload);
                }catch(e){
                    console.log(e);
                    this.status = 401;
                    return;
                }
            }
        }
 
        yield next;
    };
};