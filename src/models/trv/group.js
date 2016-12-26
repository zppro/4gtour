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
            operated_on: {type: Date, default: Date.now},
            name: {type: String, required: true},
            status: {type: Number, min: 0, max: 1, default: 1},
            group_status: {type: String, enum: ctx._.rest(ctx.dictionary.keys["TRV07"])},
            cancel_flag: {type: Number, min: 0, max: 1, default: 0}, //撤销标记 违法信息时设置为1
            member_id: {type: String, required: true},// 发布人Id
            member_name: {type: String}, // 发布人名称
            intro: {type: String},
            tip: {type: String}, // 注意事项
            imgs: [String],//套图
            leader: {
                nick_name: {type: String},
                phone: {type: String}
            },
            assembling_place:{
                location_text: {type: String},
                lon: {type: String},
                lat: {type: String}
            },
            assembling_time: {type: Date, required: true},
            deadline: {type: Date}, // 报名截止时间
            participate_min:{type: Number, min:2, required: true}, // 成团人数
            participate_max:{type: Number, min:2, required: true}, // 参团最大人数
            participants:[{
                participant_id: {type: String},
                name: {type: String},
                head_pic: {type: String},
                position_in_group: {type: String, enum: ctx._.rest(ctx.dictionary.keys["TRV06"])},
                phone: {type: String}
            }]
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        groupSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        groupSchema.virtual('group_status_name').get(function () {
            return ctx.dictionary.pairs['TRV07'][this.group_status].name
        });

        groupSchema.virtual('participant_number').get(function () {
            return this.participants.length;
        });

        groupSchema.virtual('participanter_ids').get(function () {
            return this.participants.map(function(o){
                return o.participant_id
            });
        });

        return mongoose.model(name, groupSchema, name);
    }
}