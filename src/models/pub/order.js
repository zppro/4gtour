/**
 * Created by zppro on 16-8-28.
 * 管理中心 订单实体
 */
var mongoose = require('mongoose');
//module.typeEnums = {"D1000":['A0001', 'A0002', 'A0003']};
module.isloaded = false;


module.exports = function(ctx,name) {
    //console.log(_.rest(ctx.dictionary.keys["D1000"]));
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var order_Item_schema = require('./func')(ctx, 'pub_func').schema;

        var failure_on_default =  function() {
            return ctx.moment().add(15, 'day');
        };

        var orderSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            code: {type: String, required: true, minlength: 12, maxlength: 12, index: {unique: true}},
            period_charge: {type: Number, default: 0.00},//期间费用，默认是一个月的开通模块总费用
            duration: {type: Number, min: 1},//持续期间，N个月
            order_items: [{
                check_in_time: {type: Date, default: Date.now},//预开通时间
                func_id: {type: String, required: true},
                func_name: {type: String, required: true},
                subsystem_id: {type: String, required: true},
                subsystem_name: {type: String, required: true},
                charge: {type: Number, default: 0.00},//月费
                orderNo: {type: Number, default: 0}//排序序号
            }],//订单明细
            type: {type: String, required: true, enum: ctx._.rest(ctx.dictionary.keys["D1004"])},
            order_status: {
                type: String,
                required: true,
                enum: ctx._.rest(ctx.dictionary.keys["D1005"]),
                default: 'A1001'
            },
            success_on: {type: Date},
            refund_on: {type: Date},
            failure_on: {type: Date, default: failure_on_default},//失效时间在下单之后的两个礼拜
            tenantId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'pub_tenant'}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        orderSchema.virtual('full_code').get(function () {
            return this.type + '-' + this.code;
        });

        orderSchema.virtual('total_charge').get(function () {
            return this.period_charge * this.duration;
        });

        orderSchema.pre('validate', function (next) {
            if (this.code == ctx.modelVariables.SERVER_GEN) {
                //考虑到并发几乎不可能发生，所以将订单编号设定为
                //[年2月2日2]+6位随机数
                this.code = ctx.moment().format('YYMMDD') + ctx.util.randomN(6);
            }
            next();
        });

        orderSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date() }});
            next();
        });

        return mongoose.model(name, orderSchema, name);
    }
}