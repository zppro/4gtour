/**
 * Created by zppro on 17-02-15.
 * 养老机构 接待实体 (移植自fsrok)
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var receptionSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            operated_by: {type: mongoose.Schema.Types.ObjectId},
            operated_by_name: {type: String},
            status: {type: Number, min: 0, max: 1, default: 1},
            code: {type: String,required: true},
            enter_code: {type: String, required: true, minlength: 6, maxlength: 6},
            elderlyId:{type: mongoose.Schema.Types.ObjectId, required: true,ref:'psn_elderly'},
            elderly_name: {type: String, required: true, maxlength: 20},
            begin_on: {type: Date, default: Date.now},
            end_on: {type: Date},
            visit_info:{
                name:{type:String,required: true,maxlength:20},
                id_no: {type: String,required: true, minlength: 18, maxlength: 18},
                sex:{type: String, minlength: 1, required: true, maxlength: 1, enum: ctx._.rest(ctx.dictionary.keys["D1006"])},
                relation_with:{type:String,required: true, minlength: 5, maxlength: 5, enum: ctx._.rest(ctx.dictionary.keys["D1012"])},
                phone: {type: String,maxlength: 20,required: true},
                address:{type:String, maxlength: 100}
            },
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

        receptionSchema.virtual('visit_summary').get(function () {
            return this.visit_info.name + '(' + ctx.dictionary.pairs["D1012"][this.visit_info.relation_with].name + ')';
        });

        receptionSchema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        receptionSchema.pre('validate', function (next) {
            if (this.code == ctx.modelVariables.SERVER_GEN) {
                //考虑到并发几乎不可能发生，所以将订单编号设定为
                //order.type+[年2月2日2]+6位随机数
                var self = this;
                if (this.tenantId) {

                    ctx.sequenceFactory.getSequenceVal(ctx.modelVariables.SEQUENCE_DEFS.RECEPTION_TO_TENANT,this.tenantId).then(function(ret){
                        self.code = ret;
                        next();
                    });
                }
                else{
                    next();
                }
            }
            else{
                next();
            }

        });

        //receptionSchema.$$skipPaths = ['visit_info'];

        return mongoose.model(name, receptionSchema, name);
    }
}