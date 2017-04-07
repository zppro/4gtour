/**
 * Created by zppro on 17-3-17.
 * 养老机构 护理计划
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

        var nursingPlanSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            elderlyId: {type: mongoose.Schema.Types.ObjectId, ref: 'psn_elderly'},
            elderly_name: {type: String},
            work_items:[{
                type: {type: String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D3017"])},
                workItemId: {type: mongoose.Schema.Types.ObjectId, ref: 'psn_workItem'},
                drugUseItemId: {type: mongoose.Schema.Types.ObjectId, ref: 'psn_drugUseItem'},
                check_in_time: {type: Date, default: Date.now},
                customize_flag: {type: Boolean, default: false}, // 自定义标识,一旦确定无法修改
                name: {type: String, required: true, maxlength: 100},
                description: {type: String,maxLength:400},
                repeat_type: {type: String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D0103"])},
                repeat_values: [{type: Number, min: 0, max: 365, default: 0}],
                repeat_start: {type: String, minlength: 1, maxlength: 5, default: '*'},
                duration: {type: Number, default: 0}, // 完成时长 单为分
                confirm_flag: {type: Boolean, default: false}, // 需要护工确认标识
                remind_flag: {type: Boolean, default: false}, // 需要提醒标识
                remind_type: {type: String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D0104"])},
                remind_times: {type: Number}, // 提醒次数
                remark: {type: String,maxLength:200} //可以对某一个项目进行备注
            }],
            remark: {type: String,maxLength:200},
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        nursingPlanSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, nursingPlanSchema, name);
    }
}