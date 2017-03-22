/**
 * elderlySpecificSpotChangeLog Created by zppro on 17-3-21.
 * Target:老人信息特殊处(非常规)修改
 */
var mongoose = require('mongoose');


module.isloaded = false;

module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        //这里不同租户下的老人应该是互相隔离的，因此不同租户的老人身份证号可以相同，但同一租户的老人身份证号不能相同
        var elderlySpecificSpotChangeLogSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            operated_by: {type: mongoose.Schema.Types.ObjectId},
            operated_by_name: {type: String},
            elderlyId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'psn_elderly'},
            elderly_name: {type: String},
            col_name: {type: String, required: true, maxlength: 20},
            col_val_old: {type: String, required: true},
            col_val_new: {type: String, required: true},
            fromMethod: {type: String, required: true},
            tenantId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'pub_tenant'}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        elderlySpecificSpotChangeLogSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });
  
        return mongoose.model(name, elderlySpecificSpotChangeLogSchema, name);
    }
}