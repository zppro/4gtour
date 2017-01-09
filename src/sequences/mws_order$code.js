/**
 * order_PFT$code Created by zppro on 17-1-9.
 * Target:mws_order中code使用序列的定义
 */

var object_type = 'mws_order';
var object_key = 'code';
var prefix = '';
var suffix = undefined;
var date_area_period_format = 'YYMMDD';
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