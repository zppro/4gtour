/**
 * journal-account Created by zppro on 16-8-28.
 * Target:租户资金流水
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var tenantJournalAccountSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            voucher_no:{type: String},
            revenue_and_expenditure_type: {type: String, minlength: 5, maxlength: 5, required: true, enum: ctx._.rest(ctx.dictionary.keys["D3001"])},
            digest: {type: String,required: true},//摘要名称
            carry_over_flag:{type: Boolean,default: false},//结转标志 true-已结转 false-未结转
            red_flag:{type: Boolean,default: false},//冲红标志 true-冲红流水 false-正常流水
            amount:{type: Number, default: 0.00},//金额
            source_type:{type: String},//来源表 i.e. pub_elderly
            source_id:{type: mongoose.Schema.Types.ObjectId},//来源表_id
            source_key:{type: String},//来源键 $代表数组 $journal_account.voucher_no/voucher_no
            tenantId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'pub_tenant'}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        tenantJournalAccountSchema.virtual('revenue_flag').get(function () {
            return (this.revenue_and_expenditure_type || '').substr(0, 1) == 'A';
        });

        return mongoose.model(name, tenantJournalAccountSchema, name);
    }
}