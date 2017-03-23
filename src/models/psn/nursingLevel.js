/**
 * Created by zppro on 17-3-23.
 * 养老机构 护理级别
 */
var mongoose = require('mongoose');
var D3015 = require('../../pre-defined/dictionary.json')['D3015'];

module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var nursingLevelSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            nursing_assessment_grade: {type: String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D3015"])},
            name: {type: String, required:true, maxlength: 20},
            short_name: {type: String, required:true, maxlength: 4},
            stop_flag: {type: Boolean, default: false},//停用标志
            stoped_on: {type: Date},
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        nursingLevelSchema.virtual('nursing_assessment_grade_name').get(function () {
            if (this.nursing_assessment_grade) {
                return D3015[this.nursing_assessment_grade].name;
            }
            return '';
        });

        nursingLevelSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, nursingLevelSchema, name);
    }
}