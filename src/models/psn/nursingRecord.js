/**
 * Created by zppro on 17-3-27.
 * 养老机构 护理记录
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

        var nursingRecordSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            elderlyId: {type: mongoose.Schema.Types.ObjectId, ref: 'psn_elderly'},
            elderly_name: {type: String},
            gen_batch_no: {type: String, required: true, minlength: 10, maxlength: 10},
            workItemId: {type: mongoose.Schema.Types.ObjectId, ref: 'psn_workItem'},
            name: {type: String, required: true, maxlength: 100},
            description: {type: String,maxLength:400},
            remark: {type: String,maxLength:200},
            duration: {type: Number, default: 0}, // 完成时长 单为分
            assigned_worker: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'psn_nursingWorker'}, // 分配的护工
            exec_time:{type: Date, required: true},
            confirmed_on: {type: Boolean, default: false}, // 护工已确认标识
            confirmed_worker: {type: mongoose.Schema.Types.ObjectId, ref: 'psn_nursingWorker'}, // 确认的护工
            remind_on:[{type: Date, required: true}], //提醒时间
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        nursingRecordSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, nursingRecordSchema, name);
    }
}