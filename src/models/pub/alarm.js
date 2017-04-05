/**
 * Created by zppro on 17-4-5.
 * 公共 报警
 */
var mongoose = require('mongoose');
var D3016 = require('../../pre-defined/dictionary.json')['D3016'];

module.isloaded = false;


module.exports = function(ctx,name) {
    //console.log(_.rest(ctx.dictionary.keys["D1000"]));
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var alarmSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            subject: {type: String, required: true}, // pub_bedMonitor 报警设备
            subjectId: {type: mongoose.Schema.Types.ObjectId, required: true}, //报警设备编号
            subject_name: {type: String, required: true, maxlength: 100}, //报警设备名称
            object: {type: String, required: true}, // psn_elderly 报警对象
            objectId: {type: mongoose.Schema.Types.ObjectId, required: true}, //报警对象编号
            object_name: {type: String, required: true}, //报警对象名称
            reason: {type: String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D3016"])},//报警原因
            process_flag: {type: Boolean, default: false},//处理标识
            processed_on: {type: Date},
            processed_by: {type: mongoose.Schema.Types.ObjectId},
            processed_by_name: {type: String},
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        alarmSchema.virtual('reason_name').get(function () {
            if (this.reason) {
                return D3016[this.reason].name;
            }
            return '';
        });

        alarmSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, alarmSchema, name);
    }
}