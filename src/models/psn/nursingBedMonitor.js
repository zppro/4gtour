/**
 * Created by zppro on 17-3-8.
 * 养老机构 护理离床监测
 */
var mongoose = require('mongoose');
var D3009 = require('../../pre-defined/dictionary.json')['D3009'];

module.isloaded = false;


module.exports = function(ctx,name) {
    //console.log(_.rest(ctx.dictionary.keys["D1000"]));
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var nursingBedMonitorSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            code: {type: String, required: true, maxlength: 30},
            name: {type: String, required: true, maxlength: 30},
            device_status: {type: String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D3009"])},//设备状态 在线 离线
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        nursingBedMonitorSchema.virtual('device_status_name').get(function () {
            if (this.device_status) {
                return D3009[this.device_status].name;
            }
            return '';
        });

        nursingBedMonitorSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, nursingBedMonitorSchema, name);
    }
}