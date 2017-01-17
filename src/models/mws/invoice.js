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
            title: {type: String},
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