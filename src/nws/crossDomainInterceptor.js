/**
 * Created by zppro on 16-8-28.
 */

module.exports = function (app) {
    var allowOrigins = ['http://m2.okertrip.com', 'http://192.168.255.106:8080', 'http://192.168.101.3:8080', 'http://localhost:8080'];
    return function *(next) {
        console.log('crossDomain');
        var self = this;
        var origin = this.request.headers['origin'];
        if (app._.contains(allowOrigins, origin)) {
            this.set('Access-Control-Allow-Origin', origin);
            this.set('Access-Control-Allow-Credentials', 'true');
            this.set('Access-Control-Allow-Headers', 'Content-Type,Content-Length,Authorization,Accept,X-Requested-With,Origin,Access-Control-Allow-Origin,X-Custom-TS');
            this.set('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
        } 

        yield next;
    };
};