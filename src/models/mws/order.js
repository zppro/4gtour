/**
 * Created by zppro on 17-1-9
 * web商城 订单实体
 */
var mongoose = require('mongoose');
var MWS01 = require('../../pre-defined/dictionary.json')['MWS01'];
var MWS02 = require('../../pre-defined/dictionary.json')['MWS02'];
var MWS03 = require('../../pre-defined/dictionary.json')['MWS03'];
var MWS04 = require('../../pre-defined/dictionary.json')['MWS04'];
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var order_Schema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            code: {type: String, required: true, minlength: 10, maxlength: 10, index: {unique: true}},//本地订单编号 按照规则 6位年月日+3位序列+ + suffix = 'P/D'
            order_status: {type: String, required: true, enum: ctx._.rest(ctx.dictionary.keys["MWS01"])},
            pay_type: {type: String, enum: ctx._.rest(ctx.dictionary.keys["MWS02"])},//订单支付方式
            pay_time: {type: Date},//订单支付时间
            trade_time_start: {type: Date, required: true, default: Date.now},
            trade_time_expire: {type: Date, required: true},
            transaction_id: {type: String},//支付流水号
            amount: {type: Number, default: 0.00},//订单金额
            items: [{
                spu_id: {type: mongoose.Schema.Types.ObjectId},//标准产品单元名称
                spu_name: {type: String},
                sku_id: {type: mongoose.Schema.Types.ObjectId},//标准库存单元名称
                sku_name: {type: String},
                img: {type: String},
                price: {type: Number, required: true},//下单单价 单位元
                market_price:  {type: Number},//市场价 单位元
                quantity: {type: Number, required: true},//数量
            }],
            open_id: {type: String, required: true},//下单人OpenId
            order_nickname: {type: String},//下单人昵称
            ip: {type: String},//下单人ip
            memo:  {type: String},//收件人手机: {type: String},//订单备注
            shipping_fee: {type: Number, default: 0.00},//运费
            shipping_info:{
                shipping_nickname: {type: String},//收件人名称
                shipping_phone:  {type: String, required: true},//收件人手机
                province: {type: String, required: true},
                city: {type: String, required: true},
                area: {type: String, required: true},
                address:  {type: String, required: true}
            },
            tracking:[{
                check_in_time: {type: Date, default: Date.now},
                description:  {type: String}
            }],
            logistics_code: {type: String},
            invoice_flag: {type: Boolean, default: false}, //默认不开票
            invoice_info:{
                type: {type: String, enum: ctx._.rest(ctx.dictionary.keys["MWS03"])},
                title_type: {type: String, enum: ctx._.rest(ctx.dictionary.keys["MWS04"])},
                title: {type: String}
            },
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        order_Schema.pre('validate', function (next) {
            if (this.code == ctx.modelVariables.SERVER_GEN) {
                var self = this;
                ctx.sequenceFactory.getSequenceVal(ctx.modelVariables.SEQUENCE_DEFS.ORDER_OF_MERCHANT_WEBSTORE).then(function(ret){
                    console.log('mws_order$code:'+ret);
                    self.code = ret;
                    next();
                });
            }
            else{
                next();
            }
        });

        order_Schema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        order_Schema.virtual('order_status_name').get(function () {
            return MWS01[this.order_status].name;
        });
        order_Schema.virtual('pay_type_name').get(function () {
            if (this.pay_type) {
                return MWS02[this.pay_type].name;
            }
            return '';
        });

        return mongoose.model(name, order_Schema, name);
    }
}