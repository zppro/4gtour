/**
 * Created by zppro on 17-01-06
 * SPU
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var spuSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            name: {type: String, required: true},
            status: {type: Number, min: 0, max: 1, default: 1},
            cancel_flag: {type: Number, min: 0, max: 1, default: 0}, //撤销标记 违法信息时设置为1
            intro: {type: String},
            intro_url: {type: String},
            imgs: [String],//套图
            sales_monthly: {type: Number, min:0, default: 0},
            sales_all: {type: Number, min:0, default: 0},
            shipment_place: {type: String},
            shipment_price: {type: Number, min:0, required: true},
            skus:[{
                name: {type: String},
                sale_price:{type: Number, min:0},
                market_price:{type: Number, min:0}
            }],
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        spuSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        spuSchema.virtual('sale_price_lower').get(function () {
            if (this.skus.length == 0) {
                return 0
            } else {
                return ctx._.min(this.skus,function(o){
                    return o.sale_price
                })
            }
        });

        spuSchema.virtual('sale_price_upper').get(function () {
            if (this.skus.length == 0) {
                return 0
            } else {
                return ctx._.max(this.skus,function(o){
                    return o.sale_price
                })
            }
        });

        spuSchema.virtual('market_price_lower').get(function () {
            if (this.skus.length == 0) {
                return 0
            } else {
                return ctx._.min(this.skus,function(o){
                    return o.market_price
                })
            }
        });

        spuSchema.virtual('market_price_upper').get(function () {
            if (this.skus.length == 0) {
                return 0
            } else {
                return ctx._.max(this.skus,function(o){
                    return o.market_price
                })
            }
        });

        return mongoose.model(name, spuSchema, name);
    }
}