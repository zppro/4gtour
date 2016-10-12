/**
 * Created by zppro on 16-8-28.
 */

module.exports = function (app){
    return function * (next) {
        var self = this;
        console.log(this.request);
        this.set('Access-Control-Allow-Origin', 'http://localhost:8080');
        this.set('Access-Control-Allow-Headers', 'Content-Type,Content-Length,Authorization,Accept,X-Requested-With');
        this.set('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
        if (this.request.method == 'OPTIONS') {
            this.send(200);
        }
        else {
            yield next;
        }
    };
};