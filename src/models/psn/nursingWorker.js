/**
 * Created by zppro on 17-3-6.
 * 养老机构 护工实体
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

        var nursingWorkerSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            code: {type: String, required: true, maxlength: 30, index: {unique: true}},
            name: {type: String, required: true, maxlength: 30},
            id_no: {type: String, minlength: 18, maxlength: 18},
            phone: {type: String, maxlength: 20},
            stop_flag: {type: Boolean, default: false},//停用标志 租户是否可用
            stoped_on: {type: Date},
            py: {type: String},
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        });

        nursingWorkerSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, nursingWorkerSchema, name);
    }
}