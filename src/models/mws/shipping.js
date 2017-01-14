/**
 * Created by zppro on 17-01-13
 * SHIPPING 配送信息
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var shippingSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            open_id: {type: String, required: true},//下单人OpenId
            shipping_nickname: {type: String},//收件人名称
            shipping_phone:  {type: String, required: true},//收件人手机
            province: {type: String, required: true},
            city: {type: String, required: true},
            area: {type: String, required: true},
            address:  {type: String, required: true},
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

        shippingSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, shippingSchema, name);
    }
}