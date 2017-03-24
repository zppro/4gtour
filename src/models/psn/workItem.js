/**
 * Created by zppro on 17-3-22.
 * 养老机构 工作项目
 */
var mongoose = require('mongoose');
var D3012 = require('../../pre-defined/dictionary.json')['D3012'];
var D0103 = require('../../pre-defined/dictionary.json')['D0103'];
var D0104 = require('../../pre-defined/dictionary.json')['D0104'];

module.isloaded = false;


module.exports = function(ctx,name) {
    //console.log(_.rest(ctx.dictionary.keys["D1000"]));
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var workItemSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            nursingLevelId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'psn_nursingLevel'},
            customize_flag: {type: Boolean, default: false}, // 自定义标识,一旦确定无法修改
            name: {type: String, required: true, maxlength: 100},
            description: {type: String,maxLength:200},
            duration: {type: Number, default: 0}, // 完成时长 单为分
            repeat_type: {type: String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D0103"])},
            repeat_values: [{type: Number, min: 0, max: 365, default: 0}],
            repeat_start: {type: String, minlength: 1, maxlength: 5, default: '*'},
            confirm_flag: {type: Boolean, default: false}, // 需要护工确认标识
            remind_flag: {type: Boolean, default: false}, // 需要提醒标识
            remind_mode: {type: String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D0104"])},
            remind_times: {type: Number}, // 提醒次数
            fee_flag: {type: Boolean, default: false}, // 是否需要收费
            fee: {type: Number}, // 费用
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        workItemSchema.virtual('nursing_catalog_name').get(function () {
            if (this.nursing_catalog) {
                return D3012[this.nursing_catalog].name;
            }
            return '';
        });

        workItemSchema.virtual('repeat_type_name').get(function () {
            if (this.repeat_type) {
                return D0103[this.repeat_type].name;
            }
            return '';
        });

        workItemSchema.virtual('remind_mode_name').get(function () {
            if (this.remind_mode) {
                return D0104[this.remind_mode].name;
            }
            return '';
        });

        workItemSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, workItemSchema, name);
    }
}