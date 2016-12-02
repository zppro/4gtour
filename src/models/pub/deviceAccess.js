/**
 * Created by zppro on 16-12-2.
 * 管理中心 设备访问实体
 */
var mongoose = require('mongoose');
//module.typeEnums = {"D1000":['A0001', 'A0002', 'A0003']};
module.isloaded = false;


module.exports = function(ctx,name) {
    //console.log(_.rest(ctx.dictionary.keys["D1000"]));
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var deviceAccessSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            access_on: {type: Date, default: Date.now},
            app_id: {type: String, enum: ctx._.rest(ctx.dictionary.keys["D0102"])},
            platform: {type: String, enum: ctx._.rest(ctx.dictionary.keys["D0100"])},
            os: {type: String, enum: ctx._.rest(ctx.dictionary.keys["D0101"])},
            ver: {type: String},
            uuid: {type: String},
            access_times: {type: Number, default: 1},//访问次数
        });
        deviceAccessSchema.pre('update', function (next) {
            this.update({}, {$set: {access_on: new Date()}});
            next();
        });

        return mongoose.model(name, deviceAccessSchema, name);
    }
}