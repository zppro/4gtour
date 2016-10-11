/**
 * Created by zppro on 16-9-20
 * 接口数据存储 票付通 门票实体
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var ticket_PFT_Schema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            sync_flag: {type: Boolean, default: false},//同步标志
            show_name: {type: String},//显示名称 -由平台定义而非来自接口
            sale_price: {type: Number},//实际销售价 单位元
            UUlid: {type: Number, required: true},//景区id
            UUid: {type: Number, required: true},//门票id
            UUtitle: {type: String, required: true},//门票名称
            UUpid:{type: String, required: true},//产品id
            UUgetaddr: {type: String},//取票信息
            UUdelaydays: {type: String},//允许推迟游玩的天数
            UUstatus: {type: Number},//门票在售状态 0 在售
            UUreb: {type: String},//退款手续费
            UUreb_type: {type: Number},//退款类型 取消费用类型 0 百分比,1 实际指定具体值
            UUdhour: {type: String},//提前下单截止日具体时 (时:分:秒)12:12:12
            UUstartplace: {type: String},//出发城市或地区 (线路)
            UUendplace: {type: String},//目的地 (线路)
            UUtourist_info:{type: Number},//游客信息 0 不需要填写 1只需填写一位游客信息 2 需要填写每位游客信息(一次只能购买一张票)
            UUass_station: {type: String},//集合地点
            UUseries_model: {type: String},//团号模型 类推(线路)XXX{年月日131212}XXX(线路)
            UUaid: {type: Number},//供应商 id
            UUtprice: {type: Number},//门市价 单位元
            UUpay: {type: Number},//支付方式 0 现场支付 1 在线支付
            UUbuy_limit_up: {type: Number},//一次最多购买的票数
            UUbuy_limit_low: {type: Number},//一次最少购买的票数
            UUrefund_audit: {type: Number},//是否需要退款审核
            UUnotes: {type: String},//产品说明
            UUddays: {type: Number},//提前预定天数
            buy_limit: {type: Number},//限购类型
            buy_limit_date: {type: Number},//限购方式
            buy_limit_num: {type: Number}//限购张数
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        ticket_PFT_Schema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, ticket_PFT_Schema, name);
    }
}