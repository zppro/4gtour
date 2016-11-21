/**
 * scenerySpot$code Created by zppro on 16-11-21.
 * Target:scenicSpot中code使用序列的定义
 */

var object_type = 'scenerySpot';
var object_key = 'code';
var prefix = 'JD0';
var suffix = undefined;
var date_area_period_format = 'PPCCAA';
var min = 1;
var max = 999;
var step = 1;

module.exports = {
    object_type: object_type,
    object_key: object_key,
    prefix: prefix,
    date_area_period_format: date_area_period_format,
    //date_area_period: ctx.moment().format(date_area_period_format),因为是动态的
    suffix: suffix,
    min: min,
    max: max,
    step: step,
    current: min,
    init: function (ctx) {
        this.ctx = ctx;
        this.suffix = this.ctx.conf.isProduction ? 'P' : 'D';
    }
};