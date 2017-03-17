/**
 * Created by zppro on 17-3-17.
 * 养老机构 护理排班模版
 */
var mongoose = require('mongoose');
var D3010 = require('../../pre-defined/dictionary.json')['D3010'];
var D3011 = require('../../pre-defined/dictionary.json')['D3011'];

module.isloaded = false;


module.exports = function(ctx,name) {
    //console.log(_.rest(ctx.dictionary.keys["D1000"]));
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var nursingScheduleTemplateSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            name: {type: String, required: true, maxlength: 100},
            type: {type: String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D3010"])},
            stop_flag: {type: Boolean, default: false},//停用标志 模版是否停用,当模版中的护工停用或者房间停用或变化
            stop_result: {type: String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D3011"])},
            content:[{
                x_axis: {type: Number, min: 0, required: true},
                y_axis: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'psn_room'},
                aggr_value: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'psn_nursingWorker'}
            }],
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        nursingScheduleTemplateSchema.virtual('type_name').get(function () {
            if (this.type) {
                return D3010[this.type].name;
            }
            return '';
        });

        nursingScheduleTemplateSchema.virtual('stop_result_name').get(function () {
            if (this.stop_result) {
                return D3011[this.stop_result].name;
            }
            return '';
        });

        nursingScheduleTemplateSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, nursingScheduleTemplateSchema, name);
    }
}