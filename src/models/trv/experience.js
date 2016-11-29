/**
 * Created by zppro on 16-11-22
 * 标准-见闻
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var experience_Schema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            operated_on: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            category: {type: String, required: true, enum: ctx._.rest(ctx.dictionary.keys["TRV00"])},//见闻类别
            content: {type: String, required: true}, //内容
            imgs: [{type: String}],//感想套图
            location: {type: String},// 位置
            who_can_see: {type: String, required: true, enum: ctx._.rest(ctx.dictionary.keys["TRV01"])},//信息查看等级
            cancel_flag: {type: Number, min: 0, max: 1, default: 0}, //撤销标记 违法信息时设置为1
            member_id: {type: String, required: true},//下单人Id
            member_name: {type: String}, //下单人名称
            likes: {type: Number, default:0}, //赞数
            stars: {type: Number, default:0}, //收藏数
            retweets: {type: Number, default:0}, //转发数
            retweet_flag: {type: Number, min: 0, max: 1, default: 0}, //转发标记此见闻是转发的而非原创的
            retweet_from: {
                item_id: {type: mongoose.Schema.Types.ObjectId, ref: 'experience'},
                member_id: {type: String},//人Id
                member_name: {type: String}, //人名称
            },//转发的来源文章 理解为父辈
            retweet_root: {
                item_id: {type: mongoose.Schema.Types.ObjectId, ref: 'experience'},
                member_id: {type: String},//人Id
                member_name: {type: String}, //人名称
            }, //转发的原创文章 理解为祖先
            pure_content: {type: String, max: 200}, //retweet_flag=true时 存储带//@的文本，而content则转化为带链接的
            retweet_chains: [String],
            /**** 以下是category==route的扩展信息*****/
            route:[{
                type: {type: String, enum: ctx._.rest(ctx.dictionary.keys["TRV02"])},
                imgs: [{type: String}],//景点套图
                scenerySpotId: {type: mongoose.Schema.Types.ObjectId, ref: 'trv_scenerySpot'}, // type==景点时使用，其他为空
                time_consuming: {type: String, enum: ctx._.rest(ctx.dictionary.keys["TRV03"])}, //type==景点时使用为游览时间，其他为耗时 
                content: {type: String}, //感受 说明
                order_no: {type: Number, required: true} //路线的顺序，非常重要 type==景点时使用整数，type==路线时是两个景点整数间的浮点数 如1.1 2.1
            }]
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        experience_Schema.pre('update', function (next) {
            this.update({}, {$set: {operated_on: new Date()}});
            next();
        });

        experience_Schema.virtual('time_description').get(function () {
            return ctx.moment(this.check_in_time).fromNow();
        });


        return mongoose.model(name, experience_Schema, name);
    }
}