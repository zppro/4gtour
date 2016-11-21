/**
 * booking$tenant Created by zppro on 16-7-1
 * Target:用来做租户记账凭证，因此关联的是两个账户的流水凭证，关联pub_tenantJournalAccount中voucher_no和pub_elderly.journal_account.voucher_no
 */

var object_type = 'booking';
var object_key = 'tenant';
var prefix = undefined;
var suffix = undefined;
var date_period_format = 'YYMM';
var min = 1;
var max = 9999;
var step = 1;

module.exports = {
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