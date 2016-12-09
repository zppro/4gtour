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
            last_check_in_time: {type: Date, default: Date.now},
            code: {type: String, required: true}, // 对外部的member_id
            name: {type: String, required: true}, // 对外部的member_name
            head_portrait:  {type: String}, // 对外部的 member_head_portrait
            following: {type: Number, default:0}, // 当前用户的关注人数
            follower: {type: Number, default:0}, // 当前用户的粉丝人数
            tweeted: {type: Number, default:0}, // 当前用户的发表的见闻数量
            stared: {type: Number, default:0}, // 当前用户的收藏的见闻数量
            check_status: {type: Number}, // 0-离线 1-在线
        });

        memberSchema.pre('update', function (next) {
            this.update({}, {$set: {last_check_in_time: new Date()}});
            next();
        });

        return mongoose.model(name, memberSchema, name);
    }
}