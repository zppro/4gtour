/**
 * Created by zppro on 16-8-28.
 */

var cdaOrigins = require('../pre-defined/cda-origins.json');
module.exports = function (app) {
    var re = /https?:\/\/192\.168\.([0-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.([0-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]):?[0-9]*/gi;//内网地址
    return function *(next) {
        // console.log('crossDomain');
        var self = this;
        var origin = (this.request.headers['origin'] || '').toLowerCase();
        // console.log(origin);
        var patched = app._.contains(cdaOrigins, origin) || origin.match(re);
        if (patched) {
            this.set('Access-Control-Allow-Origin', origin);
            this.set('Access-Control-Allow-Credentials', 'true');
            this.set('Access-Control-Allow-Headers', 'Content-Type,Content-Length,Authorization,Accept,X-Requested-With,Origin,Access-Control-Allow-Origin,X-Custom-TS');
            this.set('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
        }
        else{
            console.log('api invoke')
        }

        yield next;
    };
};