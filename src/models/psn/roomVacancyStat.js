/**
 * Created by zppro on 17-2-15.
 * 养老机构 房间空置情况统计 (移植自fsrok)
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var roomVacancyStatSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            period: {type: String, required: true, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D1015"])},
            period_value:{type: String, required: true},//2016-01,2016...
            amount_brought_forward:{type: Number, required: true,default:0},
            amount_check_in:{type: Number, required: true},
            amount_check_out:{type: Number, required: true},
            amount: {type: Number},
            settlement_flag: {type: Boolean, default: false},
            tenantId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'pub_tenant'}
        });


        return mongoose.model(name, roomVacancyStatSchema, name);
    }
}