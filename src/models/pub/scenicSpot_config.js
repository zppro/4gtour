/**
 * Created by zppro on 16-10-10
 * 景点实体配置信息
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var scenicSpot_config_Schema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            idc_name: {type: String, required: true},//idc 表名称 例如：idc目录下的scenicSpot_PFT
            primary_key: {type: String, required: true},//关联的唯一字段名称 例如： UUid
            primary_value: {type: String, required: true},//关联的唯一字段取值 例如： 4392
            config_key: {type: String, required: true},//配置的是idc_name表里的哪个字段 例如:show_name
            config_value: {type: String}//配置的字段的取值 例如：zzz
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        scenicSpot_config_Schema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });


        return mongoose.model(name, scenicSpot_config_Schema, name);
    }
}