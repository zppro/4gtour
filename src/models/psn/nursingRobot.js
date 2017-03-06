/**
 * Created by zppro on 17-3-6.
 * 养老机构 护工机器人
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

        var nursingRobotSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            code: {type: String, required: true, maxlength: 30, index: {unique: true}},
            name: {type: String, required: true, maxlength: 30},
            power: {type: Number, min: 0, max: 100, default: 0},
            phone: {type: String, maxlength: 20},
            robot_status: {type: String, minlength: 1, maxlength: 1, enum: ctx._.rest(ctx.dictionary.keys["D3009"])},//机器人状态
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        });

        nursingRobotSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, nursingRobotSchema, name);
    }
}