/**
 * Created by yrm on 17-3-21.
 * 养老机构 药品库存实体
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var drugStockSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            elderId:{type: mongoose.Schema.Types.ObjectId,required: true,ref:'psn_elderly'},//关联老人
            drugId:{type: mongoose.Schema.Types.ObjectId,required: true,ref:'psn_drug'},//关联药品
            in_out_no:{type: String},//出入库单号
            type:{type: String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D3006"])},//出入库类别
            in_out_quantity:{type:Number},//出入库数量
            current_quantity:{type:Number},//当前数量
            unit:{type: String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D3006"])},//包装单位
            operated_by: {type: mongoose.Schema.Types.ObjectId},
            operated_by_name: {type: String},
            tenantId: {type: mongoose.Schema.Types.ObjectId,required: true,ref:'pub_tenant'}//关联机构
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        drugStockSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, drugStockSchema, name);
    }
}