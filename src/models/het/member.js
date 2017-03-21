/**
 * Created by zppro on 16-11-29.
 *  会员实体
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var memberSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            open_id: {type: String},//针对微信
            union_id: {type: String},//针对微信
            name: {type: String, required: true}, // 对外部的member_name
            passhash: {type: String, required: true}, //密码hash
            sync_flag_hzfanweng: {type: Boolean, default: false},//is success
            head_portrait:  {type: String} // 对外部的  member_head_portrait
        });

        memberSchema.pre('update', function (next) {
            this.update({}, {$set: {last_check_in_time: new Date()}});
            next();
        });

        return mongoose.model(name, memberSchema, name);
    }
}