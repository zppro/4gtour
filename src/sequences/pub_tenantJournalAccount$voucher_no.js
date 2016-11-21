/**
 * pub_tenantJournalAccount$voucher_no Created by zppro on 16-6-30.
 * Target:pub_tenantJournalAccount中voucher_no使用序列的定义(错误的业务理解，已弃用)
 */

var object_type = 'pub_tenantJournalAccount';
var object_key = 'voucher_no';
var prefix = 'T';
var suffix = undefined;
var date_period_format = 'YYMM';
var min = 1;
var max = 9999;
var step = 1;

module.exports = {
    disabled: true,
    object_type: object_type,
    object_key: object_key,
    prefix: prefix,
    date_area_period_format: date_period_format,
    //date_area_period: ctx.moment().format(date_area_period_format),因为是动态的
    suffix: suffix,
    min: min,
    max: max,
    step: step,
    current: min
};