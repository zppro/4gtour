/**
 * Created by zppro on 16-12-2.
 * 管理中心 app服务端更新历史
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    //console.log(_.rest(ctx.dictionary.keys["D1000"]));
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var appServerSideUpdateHistorySchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            app_id: {type: String, enum: ctx._.rest(ctx.dictionary.keys["D0102"])},
            ver: {type: String}
        });
        appServerSideUpdateHistorySchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });
        return mongoose.model(name, appServerSideUpdateHistorySchema, name);
    }
}