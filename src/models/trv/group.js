/**
 * Created by zppro on 16-12-19
 * 旅行团
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var groupSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            name: {type: String, required: true},
            intro: {type: String},
            imgs: [String],//套图
            leader: {
                nick_name: {type: String},
                phone: {type: String}
            },
            assembing: {
                place: {type: String},
                time: {type: Date}
            },
            member_limit:{type: String, required: true}, // 报名人数
            deadline:  {type: Date, required: true}, // 报名截止时间
            members:[{
                member_id: {type: String},
                member_name: {type: Date},
                member_head_pic: {type: String},
                position_in_group: {type: String, enum: ctx._.rest(ctx.dictionary.keys["TRV06"])},
            }]
        });

        return mongoose.model(name, groupSchema, name);
    }
}