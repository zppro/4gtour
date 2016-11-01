/**
 * Created by zppro on 16-10-18
 * 接口数据存储 票付通 订单实体
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        //票付通订单只支持一个产品，因此本地订单也仅支持一个产品
        var order_PFT_Schema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            sync_flag: {type: Boolean, default: false},//同步标志
            code: {type: String, required: true, minlength: 12, maxlength: 12, index: {unique: true}},//本地订单编号 按照规则 'PFT'+8位年月日+3位序列
            local_status: {type: String, required: true, enum: ctx._.rest(ctx.dictionary.keys["IDC01"])},
            pay_type: {type: String, enum: ctx._.rest(ctx.dictionary.keys["IDC02"])},//订单支付方式
            pay_time: {type: Date},//订单支付时间
            transaction_sn: {type: String},//支付流水号
            amount: {type: Number, default: 0.00},//订单金额
            p_name: {type: String, required: true},//产品名称
            p_price: {type: Number, required: true},//下单单价 单位元
            quantity: {type: Number, required: true},//排序序号
            member_id: {type: String, required: true},//下单人Id
            member_name: {type: String},//下单人名称
            link_man:  {type: String, required: true},//联系人
            link_man_id_no:  {type: String},//联系人身份证IDNo
            link_phone:  {type: String, required: true},//联系手机
            travel_date: {type: Date, required: true},//出游日期
            sms_send: {type: Number, required: true},//是否需要发送短信 0 发送 1 不发送
            deduction_type: {type: Number, required: true},//扣款方式 0使用账户余额 2使用供应商处余额 4现场支付 注:余额不足返回错误 122
            order_type: {type: Number, required: true},//下单方式 0正常下单 1 手机用户下单 注:如无特殊请使用正常下单
            UUlid: {type: Number, required: true},//景区id
            UUid: {type: Number, required: true},//门票id
            UUordernum: {type: String},//票付通订单号
            UUcode: {type: String},//凭证号
            UUqrcodeURL:{type: String},//详情及二维码地址
            UUqrcodeIMG: {type: String},//二维码图片
            UUordertime: {type: Date},//票付通下单时间
            UUstatus: {type: Number},//凭证号使用状态 0 未使用|1 已使用|2 已过期|3 被取消|4 凭证码被替代|5 被终端修改|6 被终端撤销|7 部分使用
            UUpaystatus: {type: Number},//0 景区到付|1 已成功|2 未支付
            UUdtime: {type: Date},//票付通下单时间
            UUremsg: {type: Number},//短信发送次数
            UUsmserror: {type: Number},//短信是否发送成功 0 成功 1 失败
            UUctime: {type: Date},//票付通下单时间
            UUpid:{type: String},//产品id
            UUorigin: {type: String},//订单来源
            UUmemo: {type: String},//订单备注 
            UUstartplace: {type: String},//出发城市或地区 (线路)
            UUendplace: {type: String}//目的地 (线路)
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        order_PFT_Schema.pre('validate', function (next) {

            if (this.code == ctx.modelVariables.SERVER_GEN) {
                var self = this;
                ctx.sequenceFactory.getSequenceVal(ctx.modelVariables.SEQUENCE_DEFS.ORDER_OF_PFT).then(function(ret){
                    console.log(ret);
                    self.code = ret;
                    next();
                });
            }
            else{
                next();
            }
        });

        order_PFT_Schema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, order_PFT_Schema, name);
    }
}