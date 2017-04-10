/**
 * Created by zppro on 17-4-7.
 */
var _ = require('underscore');
var jwt = require('jsonwebtoken');


module.exports = function (app){
    var ignoreAuthPaths = app.conf.authAppRobot.ignorePaths;
    return function * (next) {
        console.log('authAppRobot');
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
                // console.log(token)
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
                    token = token.substr('Bearer '.length);
                    var timestamp = this.get('X-Custom-TS');
                    // console.log('timestamp:', timestamp);

                    this.request_timestamp = timestamp;
                    var authSecret = 'woosiyuan-robot-pension-agency';
                    var payload = jwt.verify(token, authSecret + ':' + timestamp);
                    this.robot_code = payload.sub;
                    // console.log('this.robot_code:', this.robot_code);
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