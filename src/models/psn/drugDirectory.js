/**
 * Created by yrm on 17-3-21.
 * 养老机构 药品实体
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var drugDirectorySchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            drug_no:{type: String},// 药品编码
            full_name:{type: String},
            short_name:{type: String},
            alias:{type: String},
            english_name:{type: String},
            indications_function:{type: String},//药品功能主治（适用症）
            otc_flag:{type: Number, min: 0, max: 1},
            health_care_flag:{type: Number, min: 0, max: 1},
            usage:{type: String},
            price:{type: String},
            specification:{type: String},//药品规格
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        drugDirectorySchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, drugDirectorySchema, name);
    }
}