/**
 * Created by zppro on 16-8-28.
 * 管理中心 租户实体
 */
var mongoose = require('mongoose');
module.isloaded = false;

module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {;
        module.isloaded = true;

        function needRefreshToken(document) {
            return !document.token || (document.token_expired && ctx.moment(document.token_expired).diff(ctx.moment()) < 0 );
        }

        function setNewToken(document) {
            document.token = ctx.uid(8);
            document.token_expired = ctx.moment().add(3, 'M');
        }


        //var open_func_schema = require('./func')(ctx,'pub_func').schema;

        var tenantSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            name: {type: String, required: true, maxlength: 30},
            phone: {type: String, maxlength: 20, unique: true, index: true},
            email: {type: String, maxlength: 30, unique: true, index: true},
            type: {type: String, enum: ctx._.rest(ctx.dictionary.keys["D1002"])},
            active_flag: {type: Boolean, default: false},//开通标志 租户是否可用
            certificate_flag: {type: Boolean, default: false},//认证标志 是否式正式租户
            token: {type: String, required: true, minlength: 8, maxlength: 8},//租户标识(8位)
            token_expired: {type: Date},//租户标识过期时间
            validate_util: {type: Date, required: true},
            limit_to:{type: Number, min: 0,default:0},//0不限发布产品数量
            //定价模块
            price_funcs: [{
                check_in_time: {type: Date, default: Date.now},//最新定价时间
                func_id: {type: String, required: true},
                func_name: {type: String, required: true},
                subsystem_id: {type: String, required: true},
                subsystem_name: {type: String, required: true},
                price: {type: Number, default: 0.00},//期间收费价格
                orderNo: {type: Number, default: 0}//排序序号
            }],
            //开通模块（通过订单）
            open_funcs: [{
                check_in_time: {type: Date, default: Date.now},//开通时间
                func_id: {type: String, required: true},
                func_name: {type: String, required: true},
                subsystem_id: {type: String, required: true},
                subsystem_name: {type: String, required: true},
                charge: {type: Number, default: 0.00},//月费
                orderNo: {type: Number, default: 0},//排序序号
                //payed: {type: Boolean, default: false},
                expired_on: {type: Date, default: ctx.moment('1970-01-01T00:00:00+0000')}
            }],
            general_ledger:{type: Number, default: 0.00},//一般在通过流水月结转
            subsidiary_ledger: {
                self: {type: Number, default: 0.00},//主账户
                other: {type: Number, default: 0.00} //其他账户
            }
        });

        tenantSchema.pre('update', function (next) {
            this.model.findById(this._compiledUpdate.$set._id).exec().then(function (document) {
                if (needRefreshToken(document)) {
                    document.save();
                }

            });
            this.update({}, {
                $set: {
                    operated_on: new Date()
                }
            });
            next();

        });

        tenantSchema.pre('validate', function (next) {
            if (needRefreshToken(this)) {
                setNewToken(this);
            }
            next();
        });


        tenantSchema.$$skipPaths = ['price_funcs', 'open_funcs','charge_items','subsidiary_ledger'];

        //tenantSchema.methods.needRefreshToken = function(){
        //    console.log(this);
        //}

        return mongoose.model(name, tenantSchema, name);
    }
}