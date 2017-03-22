/**
 * Created by zppro on 17-3-22.
 * 养老机构 工作项目
 */
var mongoose = require('mongoose');
var D3012 = require('../../pre-defined/dictionary.json')['D3012'];

module.isloaded = false;


module.exports = function(ctx,name) {
    //console.log(_.rest(ctx.dictionary.keys["D1000"]));
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var workItemSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            nursing_catalog: {type: String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D3012"])},
            name: {type: String, required: true, maxlength: 100},
            description: {type: String,maxLength:200},
            needConfirm: {type: Boolean, default: false}, // 需要护工确认
            repeatType: {type: String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D3012"])},
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        workItemSchema.virtual('nursing_catalog_name').get(function () {
            if (this.nursing_catalog) {
                return D3012[this.nursing_catalog].name;
            }
            return '';
        });

        workItemSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, workItemSchema, name);
    }
}