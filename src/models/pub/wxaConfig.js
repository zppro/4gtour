/**
 * Created by zppro on 17-2-16
 * 微信app配置 共享版本
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var wxaConfigSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            app_id: {type: String, required: true}, //unique
            app_name: {type: String, required: true},
            templates:[{
                key: {type: String, required: true}, //查找键
                wx_template_id: {type: String, required: true} //微信模版id
            }],
            splash_img: {type: String},
            qrcode: {type: String},
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        wxAppConfigSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, wxAppConfigSchema, name);
    }
}