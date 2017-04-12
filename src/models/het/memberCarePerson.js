/**
 * Created by zppro on 17-3-22.
 *  会员关心的人
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var memberCarePersonSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            name: {type: String, required: true},//关心人的名称
            birthYear:{type:String},//关心人的age
            sex: {type: String, required: true, minlength: 1, maxlength: 1, enum: ctx._.rest(ctx.dictionary.keys["D1006"])},
            care_by: {type: mongoose.Schema.Types.ObjectId, ref: 'het_member'},
            bedMonitorId: {type: mongoose.Schema.Types.ObjectId, ref: 'pub_bedMonitor'}, //绑定关心人的设备
            tenantId: {type: mongoose.Schema.Types.ObjectId},
            portrait:  {type: String}, // 关心人的头像
        });

        memberCarePersonSchema.pre('update', function (next) {
            this.update({}, {$set: {last_check_in_time: new Date()}});
            next();
        });

        return mongoose.model(name, memberCarePersonSchema, name);
    }
}