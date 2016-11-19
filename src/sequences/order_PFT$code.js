/**
 * order_PFT$code Created by zppro on 16-10-18.
 * Target:order_PFT中code使用序列的定义
 */

var object_type = 'order_PFT';
var object_key = 'code';
var prefix = 'PFT';
var suffix = undefined;
var date_period_format = 'YYMMDD';
var min = 1;
var max = 999;
var step = 1;

module.exports = {
    object_type: object_type,
    object_key: object_key,
    prefix: prefix,
    date_period_format: date_period_format,
    //date_period: ctx.moment().format(date_period_format),因为是动态的
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