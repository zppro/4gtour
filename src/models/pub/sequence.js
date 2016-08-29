/**
 * sequence Created by zppro on 16-8-28.
 * Target:流水号生成器
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        //定位唯一=object_type+object_key+date_period
        var sequenceSchema = new mongoose.Schema({
            object_type: {type: String, required: true},//booking
            object_key: {type: String, required: true},//combine/in/out + _id,针对booking个体需要区分时使用
            prefix: {type: String},//T,BAC
            date_period_format:{type: String},//yyyyMM,yyyy-MM-dd
            date_period:{type: String},//1606,201606,160630
            suffix: {type: String},//A,BB
            min: {type: Number, required: true},
            max: {type: Number, required: true},
            step: {type: Number, required: true},
            current: {type: Number, required: true},
            close_flag:{type: Boolean,default: false}
        });

        return mongoose.model(name, sequenceSchema, name);
    }
}