/**
 * tenantChargeItemCustomized Created by zppro on 17-2-15.
 * Target:养老机构自定义收费项目 (移植自fsrok)
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var chargeItemCustomizedSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            catagory:{type: String, required: true},//item_id=charge-item.organization-psn.customized-{charge_standard}.{_id}
            name: {type: String, required: true},
            served_quantity: {type: Number, min: 0},//服务多少老人
            remark: {type: String,maxLength:400},
            tenantId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'pub_tenant'}
        });


        chargeItemCustomizedSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        chargeItemCustomizedSchema.pre('validate', function (next) {
            if (this.catagory == ctx.modelVariables.SERVER_GEN) {
                this.catagory = ctx.modelVariables.PSN.CHARGE_ITEM_CUSTOMIZED_CATAGORY._ID;
                next();
            }
            else{
                next();
            }
        });

        return mongoose.model(name, chargeItemCustomizedSchema, name);
    }
}