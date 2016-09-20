/**
 * Created by zppro on 16-9-20
 * 接口数据存储 票付通 景点实体
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var scenicSpot_PFT_Schema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            sync_flag: {type: Boolean, default: false},//同步标志
            UUid: {type: Number, required: true},//景区id
            UUtitle: {type: String, required: true},//景区名称
            UUaddtime: {type: Date},//景区添加时间
            UUimgpath: {type: String},//景区缩略图
            UUarea: {type: String},//所在地区
            UUp_type: {type: String, minlength: 1, maxlength: 1, enum: ctx._.rest(ctx.dictionary.keys["IDC00"])},//产品类型 A 景点 B 线路 C 酒店 F 套票 H 演出
            UUsalerid:{type: Number},//商家编号
            UUtel: {type: String},//景区联系电话
            UUfax: {type: String},//景区联系传真
            UUstatus: {type: Number},//景区在售状态 1 在售,2 下架,3 删除
            UUjtype: {type: String},//景区联系电话
            UUopentime: {type: Date},//景区开业时间
            UUruntime: {type: Date},//景区营业时间
            UUaddress: {type: String},//景区详细地址
            UUjqts: {type: String},//景区相关提示
            UUjtzn: {type: String},//交通指南
            UUbhjq: {type: String}//景点介绍
        });

        scenicSpot_PFT_Schema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, scenicSpot_PFT_Schema, name);
    }
}