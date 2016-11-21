/**
 * Created by zppro on 16-11-21
 * 标准-景点实体
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var scenerySpot_Schema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            code: {type: String, required: true,  min: 13, max: 13,index: {unique: true}}, //scenicSpot$code.js内定义
            name: {type: String, required: true}, //标准名称
            show_name: {type: String},//显示名称 -由平台定义而非来自接口
            img: {type: String},//景区默认图
            area: {type: String},//所在地区
            tel: {type: String},//景区联系电话
            level: {type: String},//景区级别
            runtime: {type: String},//景区营业时间
            address: {type: String},//景区详细地址
            tip: {type: String},//景区相关提示
            traffic: {type: String}, //交通指南
            introduction_simple:{type: String},//简单介绍
            introduction_url: {type: String},//介绍文章地址 -由平台定义而非来自接口
            tenantId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'pub_tenant'}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        scenerySpot_Schema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        return mongoose.model(name, scenerySpot_Schema, name);
    }
}