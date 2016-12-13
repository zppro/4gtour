/**
 * Created by zppro on 16-12-13.
 * 管理中心 app客户端更新历史
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

        var appClientSideUpdateHistorySchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            app_id: {type: String, enum: ctx._.rest(ctx.dictionary.keys["D0102"])},
            os: {type: String, enum: ctx._.rest(ctx.dictionary.keys["D0101"])},
            ver: {type: String, required: true}, //  1-2位.1-2位.1-2位
            ver_order: {type: Number},
            download_url: {type: String},
            force_update_flag: {type: Boolean, default: false}// 强制客户端更新
        });
        appClientSideUpdateHistorySchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });
        return mongoose.model(name, appClientSideUpdateHistorySchema, name);
    }
}