/**
 * Created by zppro on 17-02-15.
 * 养老机构 房间实体（楼房）(移植自fsrok)
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var roomSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            name: {type: String, required: true, maxlength: 30},
            floor: {type: Number, min: -99, max: 99},
            number_in_floor: {type: Number, min: 1, max: 99},
            capacity: {type: Number, required: true, min: 1},
            stop_flag: {type: Boolean, default: false},
            districtId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'psn_district'},
            nursing_robots:[{type: mongoose.Schema.Types.ObjectId, ref: 'psn_nursingRobot'}],
            bedMonitors:[{
                bed_no: {type: Number, min: 1},
                bedMonitorId: {type: mongoose.Schema.Types.ObjectId, ref: 'pub_bedMonitor'}
            }],
            tenantId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'pub_tenant'}
        });

        roomSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, roomSchema, name);
    }
}