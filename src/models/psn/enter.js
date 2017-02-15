/**
 * Created by zppro on 17-02-15.
 * 养老机构 入院实体 (移植自fsrok)
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var enterSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            operated_by: {type: mongoose.Schema.Types.ObjectId},
            operated_by_name: {type: String},
            status: {type: Number, min: 0, max: 1, default: 1},
            code: {type: String,required: true, minlength: 6, maxlength: 6},
            enter_on: {type: Date, default: Date.now},
            elderlyId:{type: mongoose.Schema.Types.ObjectId, required: true,ref:'psn_elderly'},
            agent_info:{
                name:{type:String,maxlength:20},
                id_no: {type: String, minlength: 18, maxlength: 18},
                sex:{type: String, minlength: 1, maxlength: 1, enum: ctx._.rest(ctx.dictionary.keys["D1006"])},
                relation_with:{type:String, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D1012"])},
                phone: {type: String,maxlength: 20},
                address:{type:String, maxlength: 100}
            },
            current_register_step: {type: String,  minlength: 5, maxlength: 5,required: true, enum: ctx._.rest(ctx.dictionary.keys["D3000"])},
            elderly_summary: {type: String},
            board_info:{type: String},
            room_info:{type: String},
            nursing_info:{type: String},
            sum_period_price:{type: Number, default: 0.00},//期间费用汇总计算列
            period_value_in_advance:{type: Number,default:0},//预收区间
            remark: {type: String,maxLength:400},
            tenantId: {type: mongoose.Schema.Types.ObjectId, required: true,ref:'pub_tenant'}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        enterSchema.virtual('deposit').get(function () {
            return this.sum_period_price * this.period_value_in_advance;//押金,预收款
        });

        enterSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        enterSchema.pre('validate', function (next) {
            if (this.code == ctx.modelVariables.SERVER_GEN) {
                //考虑到并发几乎不可能发生，所以将订单编号设定为
                //order.type+[年2月2日2]+6位随机数
                var self = this;
                if (this.tenantId) {

                    ctx.sequenceFactory.getSequenceVal(ctx.modelVariables.SEQUENCE_DEFS.ENTER_TO_TENANT,this.tenantId).then(function(ret){
                        self.code = ret;
                        console.log(self);
                        next();
                    });

                    //var tenantModel = require('../pub/tenant')(ctx, 'pub_tenant');
                    //tenantModel.findById(this.tenantId,function(err,tenant){
                    //
                    //    tenant.needRefreshToken();
                    //    self.code = tenant.token + '-' + ctx.moment().format('YYMMDD') + ctx.util.randomN(6);
                    //
                    //    next();
                    //});
                }
                else{
                    next();
                }
            }
            else{
                next();
            }

        });

        enterSchema.$$skipPaths = ['agent_info'];

        return mongoose.model(name, enterSchema, name);
    }
}