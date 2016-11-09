/**
 * Created by zppro on 16-8-28.
 */

var cdaOrigins = require('../pre-defined/cda-origins.json');
module.exports = function (app) {
    return function *(next) {
        console.log('crossDomain');
        var self = this;
        var origin = this.request.headers['origin'];
        if (app._.contains(cdaOrigins, origin)) {
            this.set('Access-Control-Allow-Origin', origin);
            this.set('Access-Control-Allow-Credentials', 'true');
            this.set('Access-Control-Allow-Headers', 'Content-Type,Content-Length,Authorization,Accept,X-Requested-With,Origin,Access-Control-Allow-Origin,X-Custom-TS');
            this.set('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
        } 

        yield next;
    };
};