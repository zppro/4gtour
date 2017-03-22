/**
 * Created by zppro on 17-3-6.
 * 养老机构 护理机器人
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

        var robotSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            code: {type: String, required: true, maxlength: 30},
            name: {type: String, required: true, maxlength: 100},
            power: {type: Number, min: 0, max: 100, default: 0},
            robot_status: {type: String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D3009"])},//机器人状态
            stop_flag: {type: Boolean, default: false},//停用标志 机器是否停用,停用则接触与房间的绑定
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        robotSchema.virtual('robot_status_name').get(function () {
            if (this.robot_status) {
                return D3009[this.robot_status].name;
            }
            return '';
        });

        robotSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, robotSchema, name);
    }
}