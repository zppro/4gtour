/**
 * RoomVacancyStatManger Created by zppro on 17-2-15.
 * Target:空房统计结转管理 (移植自fsrok)
 */

var path = require('path');
var fs = require('fs-extra');
var log4js = require('log4js');
var co = require('co');
var assert = require('assert').ok;

var statHelper = require('rfcore').factory('statHelper');


module.exports = {
    init: function (ctx) {
        console.log('init psn_room_vacancy_stat_service... ');
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
            //console.log(dir);
            yield self.ctx.wrapper.cb(fs.ensureDir)(dir, {});
            log4js.loadAppender("dateFile");

            //console.log('tenants.length:' + tenants.length);

            for (var i = 0; i < tenants.length; i++) {
                //获取当前机构结转日志
                var tenant_json = tenants[i].toObject();
                var catagory_tenant_room_vacancy_stat = tenant_json.name + '_tenant_room_vacancy_stat';


                log4js.addAppender(log4js.appenderMakers['dateFile']({
                    filename: path.join(dir, tenant_json.name),
                    pattern: '-MM-dd.log',
                    alwaysIncludePattern: true
                }), catagory_tenant_room_vacancy_stat);

                var loggerOfTenantRoomVacancyStat = log4js.getLogger(catagory_tenant_room_vacancy_stat);


                if (yield self.makeTenantSettlementMonthly(tenants[i], loggerOfTenantRoomVacancyStat)) {
                    loggerOfTenantRoomVacancyStat.info(tenant_json.name + '月度统计入住情况成功');
                }
                else {
                    loggerOfTenantRoomVacancyStat.info(tenant_json.name + '月度统计入住情况成功');
                }
            }
            return self.ctx.wrapper.res.default();
        });
    },
    makeTenantSettlementMonthly: function (tenant, logger) {
        var self = this;
        var current_period = 'A0005'
        var current_period_value = self.ctx.moment().format('YYYY-MM');
        //console.log('空置统计期间:' + account_period);
        return co(function *() {
            var result = true;

            var tenantRoomVacancyStat = yield self.ctx.modelFactory().model_query(self.ctx.models['psn_roomVacancyStat'], {
                where: {
                    status: 1,
                    period:current_period,//D1015 -月
                    tenantId: tenant._id
                }
                , select: 'period_value amount_brought_forward amount_check_in amount_check_out amount settlement_flag'
            });

            var check_in_groups,check_out_groups;
            var amount_brought_forward = 0;
            console.log('-----------tenantRoomVacancyStat.length ----------- ' + tenantRoomVacancyStat.length);
            if(tenantRoomVacancyStat.length==0) {
                //从头开始结算
                var tenantRoomOccupancyChangeHistory = yield self.ctx.modelFactory().model_query(self.ctx.models['psn_roomOccupancyChangeHistory'], {
                    where: {
                        tenantId: tenant._id
                    }
                    , select: 'check_in_time in_flag check_out_time'
                }, {limit: 1});
                if (tenantRoomOccupancyChangeHistory.length == 0) {
                    return result;
                }
                var rangeMonth = statHelper.rangeDateAsMonth(tenantRoomOccupancyChangeHistory[0].check_in_time);

                check_in_groups = yield self.ctx.modelFactory().model_aggregate(self.ctx.models['psn_roomOccupancyChangeHistory'], [
                    {
                        $match: {
                            tenantId: tenant._id,
                            in_flag: true
                        }
                    },
                    {
                        $group: {
                            _id: {year: {$year: '$check_in_time'}, month: {$month: '$check_in_time'}},
                            count: {$sum: 1}
                        }
                    },
                    {$sort: {"_id.year": 1, "_id.month": 1}},
                    {
                        $project: {
                            period_value: {
                                $concat: [
                                    {$substr: ["$_id.year", 0, 4]},
                                    "-",
                                    {
                                        $cond: {
                                            if: {$gte: ["$_id.month", 10]},
                                            then: {$substr: ["$_id.month", 0, 2]},
                                            else: {$concat: ["0", {$substr: ["$_id.month", 0, 1]}]}
                                        }
                                    }
                                ]
                            },
                            count: '$count',
                            _id: 0
                        }
                    }
                ]);

                check_out_groups = yield self.ctx.modelFactory().model_aggregate(self.ctx.models['psn_roomOccupancyChangeHistory'], [
                    {
                        $match: {
                            tenantId: tenant._id,
                            in_flag: false
                        }
                    },
                    {
                        $group: {
                            _id: {year: {$year: '$check_out_time'}, month: {$month: '$check_out_time'}},
                            count: {$sum: 1}
                        }
                    },
                    {$sort: {"_id.year": 1, "_id.month": 1}},
                    {
                        $project: {
                            period_value: {
                                $concat: [
                                    {$substr: ["$_id.year", 0, 4]},
                                    "-",
                                    {
                                        $cond: {
                                            if: {$gte: ["$_id.month", 10]},
                                            then: {$substr: ["$_id.month", 0, 2]},
                                            else: {$concat: ["0", {$substr: ["$_id.month", 0, 1]}]}
                                        }
                                    }
                                ]
                            },
                            count: '$count',
                            _id: 0
                        }
                    }
                ]);
                //console.log(check_in_groups);
                //console.log(check_out_groups);
                var arrRoomVacancyStat = [];
                var amount_check_in,amount_check_out,amount,settlement_flag;
                self.ctx._.each(rangeMonth, function (month) {
                    settlement_flag = month != current_period_value;
                    amount_check_in = (self.ctx._.findWhere(check_in_groups, {period_value: month}) || {count: 0}).count;
                    amount_check_out = (self.ctx._.findWhere(check_out_groups, {period_value: month}) || {count: 0}).count;

                    var roomVacancyStatItem = {
                        period: current_period,
                        period_value: month,
                        amount_brought_forward: amount_brought_forward,
                        amount_check_in: amount_check_in,
                        amount_check_out: amount_check_out,
                        settlement_flag: settlement_flag,
                        tenantId: tenant._id
                    }
                    //settlement_flag && (roomVacancyStatItem.amount = amount_brought_forward + amount_check_in - amount_check_out);
                    roomVacancyStatItem.amount = amount_brought_forward + amount_check_in - amount_check_out;
                    arrRoomVacancyStat.push(roomVacancyStatItem);

                    amount_brought_forward = roomVacancyStatItem.amount || 0;
                });
                //console.log(arrRoomVacancyStat);
                try{
                    yield self.ctx.modelFactory().model_bulkInsert(self.ctx.models['psn_roomVacancyStat'], {
                        rows:arrRoomVacancyStat
                    });
                    result = result && true;
                }
                catch(e){
                    logger.error(e.message);
                    result = false;
                }

            }
            else {
                var tenantRoomVacancyStatOfCurrentPeriod = self.ctx._.where(tenantRoomVacancyStat, {settlement_flag: false});
                for(var i=0;i<tenantRoomVacancyStatOfCurrentPeriod.length;i++){
                    var item = tenantRoomVacancyStatOfCurrentPeriod[i];
                    if(item.settlement_flag)
                        continue;

                    var begin = self.ctx.moment(item.period_value+'-01 00:00:00');
                    var end = self.ctx.moment(item.period_value+ '-'+ begin.daysInMonth()+ ' 23:59:59');

                    check_in_groups = yield self.ctx.modelFactory().model_aggregate(self.ctx.models['psn_roomOccupancyChangeHistory'], [
                        {
                            $match: {
                                tenantId: tenant._id,
                                in_flag: true,
                                check_in_time: {$gte: begin.toDate(), $lte: end.toDate()}
                            }
                        },
                        {
                            $group: {
                                _id: {year: {$year: '$check_in_time'}, month: {$month: '$check_in_time'}},
                                count: {$sum: 1}
                            }
                        },
                        {$sort: {"_id.year": 1, "_id.month": 1}},
                        {
                            $project: {
                                period_value: {
                                    $concat: [
                                        {$substr: ["$_id.year", 0, 4]},
                                        "-",
                                        {
                                            $cond: {
                                                if: {$gte: ["$_id.month", 10]},
                                                then: {$substr: ["$_id.month", 0, 2]},
                                                else: {$concat: ["0", {$substr: ["$_id.month", 0, 1]}]}
                                            }
                                        }
                                    ]
                                },
                                count: '$count',
                                _id: 0
                            }
                        }
                    ]);

                    check_out_groups = yield self.ctx.modelFactory().model_aggregate(self.ctx.models['psn_roomOccupancyChangeHistory'], [
                        {
                            $match: {
                                tenantId: tenant._id,
                                in_flag: false,
                                check_out_time: {$gte: begin.toDate(), $lte: end.toDate()}
                            }
                        },
                        {
                            $group: {
                                _id: {year: {$year: '$check_out_time'}, month: {$month: '$check_out_time'}},
                                count: {$sum: 1}
                            }
                        },
                        {$sort: {"_id.year": 1, "_id.month": 1}},
                        {
                            $project: {
                                period_value: {
                                    $concat: [
                                        {$substr: ["$_id.year", 0, 4]},
                                        "-",
                                        {
                                            $cond: {
                                                if: {$gte: ["$_id.month", 10]},
                                                then: {$substr: ["$_id.month", 0, 2]},
                                                else: {$concat: ["0", {$substr: ["$_id.month", 0, 1]}]}
                                            }
                                        }
                                    ]
                                },
                                count: '$count',
                                _id: 0
                            }
                        }
                    ]);

                    amount_brought_forward = item.amount_brought_forward;
                    item.amount_check_in = check_in_groups.length > 0 ? check_in_groups[0].count : 0;
                    item.amount_check_out = check_out_groups.length > 0 ? check_out_groups[0].count : 0;
                    item.settlement_flag = item.period_value != current_period_value;

                    //settlement_flag && (item.amount = amount_brought_forward + amount_check_in - amount_check_out);

                    item.amount = amount_brought_forward + item.amount_check_in - item.amount_check_out;

                    //console.log(check_in_groups[0]);
                    try{
                        yield item.save();
                        result = result && true;
                    }
                    catch(e){
                        logger.error(e.message);
                        result = false;
                    }

                    amount_brought_forward = item.amount || 0;
                }

            }
            return result;
        });
    }
};