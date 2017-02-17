/**
 * Created by zppro on 17-2-4
 * 销售渠道单元
 */
var mongoose = require('mongoose');
var MWS08 = require('../../pre-defined/dictionary.json')['MWS08'];
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var channelUnitSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            type: {type: String, required: true, enum: ctx._.rest(ctx.dictionary.keys["MWS08"])},
            code: {type: String, required: true, minlength: 1, index: {unique: true}},
            name: {type: String, required: true},
            wxa_url: {type: String},
            wxa_qrcode_width: {type: Number, default: 430},
            wxa_qrcode: {type: String},
            parentId: {type: mongoose.Schema.Types.ObjectId, ref: 'mws_channelUnit'},
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        channelUnitSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });


        channelUnitSchema.virtual('type_name').get(function () {
            if (this.type) {
                return MWS08[this.type].name;
            }
            return '';
        });


        return mongoose.model(name, channelUnitSchema, name);
    }
}