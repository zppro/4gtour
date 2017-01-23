/**
 * Created by zppro on 17-01-17
 * INVOICE 发票信息信息
 */
var mongoose = require('mongoose');
var MWS03 = require('../../pre-defined/dictionary.json')['MWS03'];
var MWS04 = require('../../pre-defined/dictionary.json')['MWS04'];
module.isloaded = false;

module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var invoiceSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            open_id: {type: String, required: true},//下单人OpenId
            type: {type: String, enum: ctx._.rest(ctx.dictionary.keys["MWS03"])},
            title_type: {type: String, enum: ctx._.rest(ctx.dictionary.keys["MWS04"])},
            title: {type: String}, // 开票抬头
            content: {type: String}, // 开票内容
            tax_number: {type: String}, // 税号 type == ‘A0005’ 增值税发票时使用
            registered_address: {type: String}, // 注册地址 type == ‘A0005’ 增值税发票时使用
            registered_phone: {type: String}, // 注册电话 type == ‘A0005’ 增值税发票时使用
            deposit_bank: {type: String}, // 开户银行 type == ‘A0005’ 增值税发票时使用
            bank_account: {type: String}, // 开户银行 type == ‘A0005’ 增值税发票时使用
            default_flag: {type: Boolean, required: false}, //默认标志
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        invoiceSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        invoiceSchema.virtual('type_name').get(function () {
            if (this.type) {
                return MWS03[this.type].name;
            }
            return '';
        });

        invoiceSchema.virtual('title_type_name').get(function () {
            if (this.title_type) {
                return MWS04[this.title_type].name;
            }
            return '';
        });

        return mongoose.model(name, invoiceSchema, name);
    }
}