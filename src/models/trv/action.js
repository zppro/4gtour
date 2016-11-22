/**
 * Created by zppro on 16-11-22
 * 标准-动作
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var action_Schema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            subject_type: {type: String, required: true, enum: ctx._.rest(ctx.dictionary.keys["TRV04"])},
            subject_id:{type: String, required: true},
            action_type: {type: String, required: true, enum: ctx._.rest(ctx.dictionary.keys["TRV05"])},
            object_type: {type: String, required: true, enum: ctx._.rest(ctx.dictionary.keys["TRV04"])},
            object_id:{type: String, required: true}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        return mongoose.model(name, action_Schema, name);
    }
}