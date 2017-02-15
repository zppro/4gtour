/**
 * Created by zppro on 17-02-15.
 * 养老机构 出院实体(移植自fsrok)
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var exitSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            operated_by: {type: mongoose.Schema.Types.ObjectId},
            operated_by_name: {type: String},
            status: {type: Number, min: 0, max: 1, default: 1},
            application_date: {type: Date, default: Date.now},//申请日期
            current_step: {type: String,  minlength: 5, maxlength: 5,required: true, enum: ctx._.rest(ctx.dictionary.keys["D3004"])},
            enter_code: {type: String, required: true, minlength: 6, maxlength: 6},
            enter_on: {type: Date},
            elderlyId:{type: mongoose.Schema.Types.ObjectId, required: true,ref:'pub_elderly'},
            elderly_name: {type: String, required: true, maxlength: 20},
            elderly_id_no: {type: String, required: true, minlength: 18, maxlength: 18},
            elderly_sex: {type: String, required: true, minlength: 1, maxlength: 1, enum: ctx._.rest(ctx.dictionary.keys["D1006"])},
            elderly_birthday: {type: Date, required: true},
            elderly_home_address:{type:String, required: true},
            agent_info:{
                name:{type:String,maxlength:20},
                id_no: {type: String,  minlength: 18, maxlength: 18},
                sex:{type: String, minlength: 1, maxlength: 1, enum: ctx._.rest(ctx.dictionary.keys["D1006"])},
                relation_with:{type:String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D1012"])},
                phone: {type: String,maxlength: 20},
                address:{type:String, maxlength: 100}
            },//陪同出院人
            exit_material:[{
                name: {type: String, required: true, maxlength: 20},
                url: {type: String, required: true}
            }],//出院材料(签字扫描件,代理人委托书电子件)
            pre_flow_audit:[{
                name: {type: String, required: true, maxlength: 20},
                operated_on: {type: Date},
                operated_by: {type: mongoose.Schema.Types.ObjectId},//流转审核人
                operated_by_name: {type: String},
                pass_flag: {type: Boolean},//流转审核通过/不通过
                comment: {type: String, maxlength: 100}//流转审核已经
            }],//前置出院流程审核
            item_return_audit:{
                operated_on: {type: Date},
                operated_by: {type: mongoose.Schema.Types.ObjectId},//物品归还审核人
                operated_by_name: {type: String},
                pass_flag: {type: Boolean},//流转审核通过/不通过
                comment: {type: String, maxlength: 100}//物品归还审核
            },//物品归还审核
            settlement_info: {
                operated_on: {type: Date},
                operated_by: {type: mongoose.Schema.Types.ObjectId},//物品归还审核人
                operated_by_name: {type: String},
                settlement_flag: {type: Boolean},
                advance_payment_amount: {type: Number, default: 0.00},//预缴金额
                charge_total: {type: Number, default: 0.00}//费用合计
            },//出院财务结算信息
            settlement_audit:{
                operated_on: {type: Date},
                operated_by: {type: mongoose.Schema.Types.ObjectId},//财务结算人
                operated_by_name: {type: String},
                pass_flag: {type: Boolean},//流转审核通过/不通过
                comment: {type: String, maxlength: 100}//财务结算审核
            },//出院财务结算审核
            print_collection: {
                expense_sheet: {type: Boolean, required: true, default: false},//费用清单
                exit_voucher: {type: Boolean, required: true, default: false}//出院证明
            },
            exit_on: {type: Date},//出院日期
            elderly_snapshot:{
                charge_standard: {type: String},
                charge_items:[{
                    item_id: {type: String, required: true},
                    item_name: {type: String, required: true},
                    period_price: {type: Number, default: 0.00},
                    period: {type: String, required: true, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D1015"])}
                }],
                journal_account:[{
                    voucher_no:{type: String},
                    revenue_and_expenditure_type: {type: String, minlength: 5, maxlength: 5, required: true, enum: ctx._.rest(ctx.dictionary.keys["D3002"])},
                    digest: {type: String, required: true},//具体项目摘要
                    check_in_time: {type: Date, default: Date.now},
                    carry_over_flag:{type: Boolean,default: false},//结转标志 true-已结转 false-未结转
                    red_flag:{type: Boolean,default: false},//冲红标志 true-冲红流水 false-正常流水
                    amount:{type: Number, default: 0.00}
                }],
                charge_item_change_history:[{
                    check_in_time: {type: Date, default: Date.now},
                    charge_item_catalog_id:{type:String,required: true},
                    old_item_id: {type: String, required: true},
                    old_item_name: {type: String, required: true},
                    old_period_price: {type: Number, default: 0.00},
                    old_period: {type: String, required: true, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D1015"])},
                    new_item_id: {type: String, required: true},
                    new_item_name: {type: String, required: true},
                    new_period_price: {type: Number, default: 0.00},
                    new_period: {type: String, required: true, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D1015"])}
                }]
            },
            remark: {type: String,maxLength:400},
            tenantId: {type: mongoose.Schema.Types.ObjectId, required: true,ref:'pub_tenant'}
        });


        exitSchema.pre('update', function (next) {
            var $setObj = {operated_on: new Date()};
            if(this._update && this._update.$set){
                if(this._update.$set.item_return_audit){
                    $setObj.item_return_audit = {operated_on: new Date()};
                }
                if(this._update.$set.settlement_audit) {
                    $setObj.settlement_audit = {operated_on: new Date()};
                }
            }
            this.update({}, {$set: $setObj});
            next();
        });

        exitSchema.$$skipPaths = ['agent_info','exit_material','pre_flow_audit','item_return_audit','settlement_info','settlement_audit','print_collection'];


        return mongoose.model(name, exitSchema, name);
    }
}