/**
 * Created by zppro on 17-3-17.
 * 养老机构 护理计划
 */
var mongoose = require('mongoose');
var D3006 = require('../../pre-defined/dictionary.json')['D3006'];

module.isloaded = false;


module.exports = function(ctx,name) {
    //console.log(_.rest(ctx.dictionary.keys["D1000"]));
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var nursingPlanSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            elderlyId: {type: mongoose.Schema.Types.ObjectId, ref: 'psn_elderly'},
            elderly_name: {type: String},
            assessment_level_pre: {type: String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D3006"])},
            assessment_level_current: {type: String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D3006"])},
            service_items: [{type: String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D3012"])}],
            remark: {type: String,maxLength:200},
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        nursingPlanSchema.virtual('assessment_level_current_name').get(function () {
            if (this.assessment_level_current) {
                return D3006[this.assessment_level_current].name;
            }
            return '';
        });
        
        nursingPlanSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, nursingPlanSchema, name);
    }
}