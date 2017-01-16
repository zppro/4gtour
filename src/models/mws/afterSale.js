/**
 * Created by zppro on 17-1-16
 * web商城 售后实体
 */
var mongoose = require('mongoose');
var MWS05 = require('../../pre-defined/dictionary.json')['MWS05'];
var MWS06 = require('../../pre-defined/dictionary.json')['MWS06'];
var MWS07 = require('../../pre-defined/dictionary.json')['MWS07'];
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var afterSaleSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            code: {type: String, required: true, minlength: 10, maxlength: 10, index: {unique: true}},//本地订单编号(10位)+ 'R' + 6位年月日+2位序列
            biz_status: {type: String, required: true, enum: ctx._.rest(ctx.dictionary.keys["MWS05"])},
            orderId: {type: mongoose.Schema.Types.ObjectId},
            order_code: {type: String, required: true},
            type: {type: String, enum: ctx._.rest(ctx.dictionary.keys["MWS06"])},//售后类型
            memo:  {type: String},//请求售后原因
            audit_result: {type: String, enum: ctx._.rest(ctx.dictionary.keys["MWS07"])},//审核结果
            audit_comment:  {type: String},//审核结果说明
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        afterSaleSchema.pre('validate', function (next) {
            if (this.code == ctx.modelVariables.SERVER_GEN) {
                var self = this;
                ctx.sequenceFactory.getSequenceVal(ctx.modelVariables.SEQUENCE_DEFS.AFTER_SALE_OF_MERCHANT_WEBSTORE).then(function(ret){
                    console.log('mws_afterSale$code:'+ret);
                    self.code = self.order_code + ret;
                    next();
                });
            }
            else{
                next();
            }
        });

        afterSaleSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        afterSaleSchema.virtual('biz_status_name').get(function () {
            return MWS05[this.biz_status].name;
        });

        afterSaleSchema.virtual('type_name').get(function () {
            return MWS06[this.type].name;
        });

        afterSaleSchema.virtual('audit_result_name').get(function () {
            return MWS07[this.audit_result].name;
        });

        return mongoose.model(name, afterSaleSchema, name);
    }
}