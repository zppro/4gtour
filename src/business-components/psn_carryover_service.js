/**
 * CarryOverManger Created by zppro on 17-2-15.
 * Target:结转管理 (移植自fsrok)
 */

var path = require('path');
var fs = require('fs-extra');
var log4js = require('log4js');
var co = require('co');
var assert = require('assert').ok;

module.exports = {
    init: function (ctx) {
        console.log('init psn_carryover_service... ');
        this.ctx = ctx;
        return this;
    },
    makeSettlementMonthly: function () {
        var self = this;
        return co(function *() {
            var tenants = yield self.ctx.modelFactory().model_query(self.ctx.models['pub_tenant'], {
                where: {
                    status: 1,
                    active_flag: true,
                    type: {'$in': ['A0001', 'A0002', 'A0003']}
                },
                select: 'name general_ledger'
            });
            var dir = path.join(self.ctx.conf.dir.log, 'schedules', path.basename(__filename, '.js'));
            console.log(dir);
            yield self.ctx.wrapper.cb(fs.ensureDir)(dir, {});
            log4js.loadAppender("dateFile");

            console.log('tenants.length:' + tenants.length);

            for (var i = 0; i < tenants.length; i++) {
                //获取当前机构结转日志
                var tenant_json = tenants[i].toObject();
                var catagory_elderly_journal_account = tenant_json.name + '_eldelry_journal_account';
                var catagory_tenant_journal_account = tenant_json.name + '_tenant_journal_account';


                log4js.addAppender(log4js.appenderMakers['dateFile']({
                    filename: path.join(dir, tenant_json.name),
                    pattern: '-MM-dd.log',
                    alwaysIncludePattern: true
                }), catagory_elderly_journal_account, catagory_tenant_journal_account);


                var loggerOfElderlyJournalAccount = log4js.getLogger(catagory_elderly_journal_account);
                var loggerOfTenantJournalAccount = log4js.getLogger(catagory_tenant_journal_account);
                //loggerOfTenantJournalAccount.info(tenant_json.name+'->月结开始');
                console.log(loggerOfElderlyJournalAccount);
                console.log(loggerOfTenantJournalAccount);

                if (yield self.makeTenantSettlementMonthly(tenants[i], loggerOfElderlyJournalAccount, loggerOfTenantJournalAccount)) {
                    loggerOfTenantJournalAccount.info(tenant_json.name + '月结成功');
                }
                else {
                    loggerOfTenantJournalAccount.info(tenant_json.name + '月结失败');
                }
            }
            return self.ctx.wrapper.res.default();
        });
    },
    makeTenantSettlementMonthly: function (tenant, loggerOfElderlyJournalAccount, loggerOfTenantJournalAccount) {
        var self = this;
        var account_period = self.ctx.moment().subtract(1, 'months').format('YYMM');
        console.log('账期:' + account_period);
        return co(function *() {
            var result = true;
            //先结转租户下每个老人的账
            var elderlys = yield self.ctx.modelFactory().model_query(self.ctx.models['psn_elderly'], {
                where: {
                    status: 1,
                    tenantId: tenant._id,
                    live_in_flag: true
                }
                , select: 'name general_ledger journal_account'
            });

            for (var i = 0; i < elderlys.length; i++) {
                var elderlyName = elderlys[i].name;
                loggerOfElderlyJournalAccount.info(elderlyName);
                var elderly$journal_account = elderlys[i].journal_account;
                var elderly$voucher_nos = [];
                var elderlyAmountToSettlement = 0;
                var needUpdate = false;
                for (var j = 0; j < elderly$journal_account.length; j++) {
                    var journal_account_item = elderly$journal_account[j];
                    if (journal_account_item.carry_over_flag == false && journal_account_item.voucher_no.substr(0, 4) == account_period) {
                        elderly$voucher_nos.push(journal_account_item.voucher_no);
                        journal_account_item.carry_over_flag = true;
                        elderlyAmountToSettlement += (journal_account_item.revenue_and_expenditure_type.substr(0, 1) == 'A' ? 1 : -1) * journal_account_item.amount;
                        needUpdate = true;
                    }
                }
                elderlys[i].general_ledger += elderlyAmountToSettlement;
                if (needUpdate) {
                    try {
                        yield self.ctx.modelFactory().model_update(self.ctx.models['psn_elderly'], elderlys[i]._id, {
                            general_ledger: elderlys[i].general_ledger,
                            journal_account: elderlys[i].journal_account
                        });
                        loggerOfElderlyJournalAccount.info(elderlyName + '结算凭证号码：' + elderly$voucher_nos.join());
                        result = result && true;
                    }
                    catch (e) {
                        loggerOfElderlyJournalAccount.error(e.message);
                        result = result && false;
                    }
                }

            }

            var tenantJournalAccount = yield self.ctx.modelFactory().model_query(self.ctx.models['pub_tenantJournalAccount'], {
                where: {
                    status: 1,
                    tenantId: tenant._id,
                    carry_over_flag: false
                }
                , select: 'voucher_no carry_over_flag revenue_and_expenditure_type amount'
            });

            console.log('tenantJournalAccount.length:' + tenantJournalAccount.length);

            var tenant$voucher_nos = [];
            var tenantAmountToSettlement = 0;
            for (var i = 0; i < tenantJournalAccount.length; i++) {
                var journal_account_item = tenantJournalAccount[i];
                if (journal_account_item.voucher_no.substr(0, 4) == account_period) {
                    tenant$voucher_nos.push(journal_account_item.voucher_no);
                    journal_account_item.carry_over_flag = true;
                    tenantAmountToSettlement += (journal_account_item.revenue_and_expenditure_type.substr(0, 1) == 'A' ? 1 : -1) * journal_account_item.amount;

                    try {
                        yield journal_account_item.save();
                        //yield self.ctx.modelFactory().model_update(self.ctx.models['pub_tenantJournalAccount'], journal_account_item._id, {
                        //    carry_over_flag: journal_account_item.carry_over_flag
                        //});
                        result = result && true;
                    }
                    catch (e) {
                        loggerOfTenantJournalAccount.error(e.message);
                        result = result && false;
                    }
                }
            }

            console.log(tenant);

            tenant.general_ledger += tenantAmountToSettlement;

            try {
                yield self.ctx.modelFactory().model_update(self.ctx.models['pub_tenant'], tenant._id, {
                    general_ledger: tenant.general_ledger
                });
                loggerOfTenantJournalAccount.info(tenant.name + '结算凭证号码：' + tenant$voucher_nos.join());
                result = result && true;
            }
            catch (e) {
                loggerOfTenantJournalAccount.error(e.message);
                result = result && false;
            }
            return result;
        });
    }
};