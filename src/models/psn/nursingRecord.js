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
            elderlyId: {type: mongoose.Schema.Types.ObjectId, ref: 'psn_elderly'},
            elderly_name: {type: String},
            roomId: {type: mongoose.Schema.Types.ObjectId, ref: 'psn_room'},
            bed_no: {type: Number, min: 1},
            gen_batch_no: {type: String, required: true, minlength: 10, maxlength: 10},
            workItemId: {type: mongoose.Schema.Types.ObjectId, ref: 'psn_workItem'},
            name: {type: String, required: true, maxlength: 100},
            description: {type: String,maxLength:400},
            remark: {type: String,maxLength:200},
            duration: {type: Number, default: 0}, // 完成时长 单为分
            exec_on: {type: Date, required: true},
            // exec_date_string:{type: String, minlength: 8, maxlength: 10}, //按需时不需要设置 2017-3-1(8) 2017-03-27(10)
            // exec_time_string:{type: String, minlength: 2, maxlength: 5}, //按需时不需要设置   :3(2) :30(3) 8:45(4) 08:30(5)
            assigned_worker: {type: mongoose.Schema.Types.ObjectId, ref: 'psn_nursingWorker'}, // 分配的护工 可滞后分配
            executed_flag: {type: Boolean, default: false}, // 护工开始执行工作项目标识
            confirmed_flag: {type: Boolean, default: false}, // 护工已确认标识
            confirmed_on: {type: Date}, // 护工确认时间
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

        // nursingRecordSchema.virtual('exec_on').get(function () {
        //     if (this.exec_date_string) {
        //         var datetimeString = this.exec_date_string + ' ' + (this.exec_time_string || '');
        //         return ctx.moment(datetimeString).toDate();
        //     }
        //     return null;
        // });

        nursingRecordSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, nursingRecordSchema, name);
    }
}