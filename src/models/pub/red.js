/**
 * red Created by zppro on 16-8-28.
 * Target:机构冲红记录
 */

var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var redSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            operated_by: {type: mongoose.Schema.Types.ObjectId},
            operated_by_name: {type: String},
            status: {type: Number, min: 0, max: 1, default: 1},
            amount:{type: Number, default: 0.00},
            voucher_no_to_red:{type: String},//需要冲红的凭证
            voucher_no:{type: String},//记账凭证 自身记账的凭证
            remark: {type: String,maxLength:400},
            tenantId: {type: mongoose.Schema.Types.ObjectId, required: true,ref:'pub_tenant'}
        });


        redSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });


        return mongoose.model(name, redSchema, name);
    }
}