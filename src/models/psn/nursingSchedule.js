/**
 * Created by zppro on 17-3-17.
 * 养老机构 护理排班
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

        var nursingScheduleSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            x_axis: {type: Date, required: true}, //时间轴
            y_axis: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'psn_room'}, //房间轴
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

        nursingScheduleSchema.virtual('x_axis_value').get(function () {
            return ctx.moment(this.x_axis).day();
        });

        nursingScheduleSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, nursingScheduleSchema, name);
    }
}