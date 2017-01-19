/**
 * Created by zppro on 17-1-18
 * 微信模版消息场景存储
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var wxTemplateMessageKeyStoreSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            open_id: {type: String, required: true},//下单人OpenId
            scene_id: {type: String, required: true},//场景id 表单提交场景下，为 submit 事件带上的 formId；支付场景下，为本次支付的 prepay_id
            use_flag: {type: Boolean, required: true, default: false}, //是否使用
            used_on:{type: Date},
            send_data: {type: String},
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        wxTemplateMessageKeyStoreSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });


        return mongoose.model(name, wxTemplateMessageKeyStoreSchema, name);
    }
}