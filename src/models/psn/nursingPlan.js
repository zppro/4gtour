/**
 * Created by zppro on 17-3-9.
 * 养老机构 护理计划
 */
var mongoose = require('mongoose');

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
            x_axis: {type: Date, required: true},
            y_axis: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'psn_room'},
            aggr_value: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'psn_nursingWorker'},
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });


        nursingPlanSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, nursingPlanSchema, name);
    }
}