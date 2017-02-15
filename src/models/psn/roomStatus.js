/**
 * roomStatus Created by zppro on 17-2-15.
 * Target:房间床位变动信息 (移植自fsrok)
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var roomStatusSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            roomId: {type: mongoose.Schema.Types.ObjectId, required: true, index: {unique: true}, ref: 'psn_room'},
            occupied: [{
                bed_no: {type: Number, min: 1, required: true},
                bed_status:{type:String, required: true,minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D3003"])},
                elderlyId: {type: mongoose.Schema.Types.ObjectId, ref: 'psn_elderly'}//不是必填，因为有其他情况
            }],//占用房间号
            tenantId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'pub_tenant'}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        roomStatusSchema.virtual('occupy_amount').get(function () {
            return (this.occupied || []).length;
        });

        roomStatusSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, roomStatusSchema, name);
    }
}