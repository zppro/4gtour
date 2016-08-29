/**
 * Created by zppro on 16-8-28.
 * 管理中心 用户实体
 */
var mongoose = require('mongoose');
//module.typeEnums = {"D1000":['A0001', 'A0002', 'A0003']};
module.isloaded = false;


module.exports = function(ctx,name) {
    //console.log(_.rest(ctx.dictionary.keys["D1000"]));
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var userSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            code: {type: String, required: true, maxlength: 30, index: {unique: true}},
            name: {type: String, required: true, maxlength: 30},
            phone: {type: String, maxlength: 20, unique: true, index: true},
            type: {type: String, enum: ctx._.rest(ctx.dictionary.keys["D1000"])},
            //role: {type: Number, min: 1, max: 9999},// bit flag
            roles: [String],
            system_flag: {type: Boolean, default: false},
            stop_flag: {type: Boolean, default: false},//开通标志 租户是否可用
            password_hash: String,
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        });

        userSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        userSchema.pre('save', function (next) {
            console.log('password_hash:');
            if (!this.password_hash) {
                //设置默认密码
                //order.type+[年2月2日2]+6位随机数
                this.password_hash = ctx.crypto.createHash('md5').update('123456').digest('hex');
            }
            next();
        });

        return mongoose.model(name, userSchema, name);
    }
}