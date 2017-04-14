/**
 * Created by zppro on 17-4-14.
 * 公共 睡眠日报
 */
var mongoose = require('mongoose');
var D3009 = require('../../pre-defined/dictionary.json')['D3009'];

module.isloaded = false;


module.exports = function(ctx,name) {
    //console.log(_.rest(ctx.dictionary.keys["D1000"]));
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var sleepDateReportOfHZFanWengSchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            status: {type: Number, min: 0, max: 1, default: 1},
            devId: {type: string},  // 对方的devId 对应我们的pub_bedMonitor.name
            date_begin: {type: Date},  // 日报样本开始时间
            date_end: {type: Date},  // 日报样本结束时间
            bed_time: {type: Date},  // 上床时间
            wakeup_time: {type: Date},  // 离床时间
            fallasleep_time: {type: Date},  // 入睡时间
            awake_time: {type: Date},  // 清醒时间
            deep_sleep_duraion: {type: Number, min: 0}, // 深度睡眠毫秒数
            light_sleep_duraion: {type: Number, min: 0}, // 浅度睡眠毫秒数
            turn_over_frequency: {type: Number, min: 0}, // 翻身次数
            bedMonitorId: {type: mongoose.Schema.Types.ObjectId, ref: 'pub_bedMonitor'},  // 睡眠带Id
            tenantId: {type: mongoose.Schema.Types.ObjectId}
        }, {
            toObject: {
                virtuals: true
            }
            , toJSON: {
                virtuals: true
            }
        });

        return mongoose.model(name, sleepDateReportOfHZFanWengSchema, name);
    }
}
