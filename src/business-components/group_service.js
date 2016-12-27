/**
 * Created by zppro on 16-11-8.
 */
var co = require('co');
var DIC = require('../pre-defined/dictionary-constants.json');
var socketServerEvents = require('../pre-defined/socket-server-events.json');
module.exports = {
    init: function (ctx) {
        console.log('init member service... ');
        var self = this;
        this.file = __filename;
        this.filename = this.file.substr(this.file.lastIndexOf('/') + 1);
        this.log_name = 'bc_' + this.filename;
        this.ctx = ctx;
        this.logger = require('log4js').getLogger(this.log_name);
        if (!this.logger) {
            console.error('logger not loaded in ' + this.file);
        }
        else {
            this.logger.info(this.file + " loaded!");
        }

        console.log(this.filename + ' ready... ');

        return this;
    },
    joinMonitoring : function () {
        var self = this;
        return co(function *() {
            try {
                var monitoringGroups = yield self.ctx.modelFactory().model_query(self.ctx.models['trv_group'], {
                    where: {
                        status: 1,
                        cancel_flag: 0,
                        group_status: {$in: [DIC.TRV07.SIGN_UP, DIC.TRV07.WAITING_TRAVEL]}
                    }
                });
                for (var i=0;i<monitoringGroups.length;i++) {
                    var group = monitoringGroups[i];
                    var group_id = group.id;
                    var isDefineDeadline = !!group.deadline;
                    var deadline = group.deadline || group.assembling_time;
                    if (group.group_status == DIC.TRV07.SIGN_UP) {
                        var isDeadlineDueTo = self.ctx.moment(deadline).unix() - self.ctx.moment().unix() <= 0;
                        if (isDeadlineDueTo) {
                            // 立即判断并更新状态
                            if (group.participant_number < group.participate_min){
                                //不成团
                                group.group_status = DIC.TRV07.INTERRUPTED;
                                yield group.save();
                                self.ctx.socket_service.sendGroupChannelEvent(socketServerEvents.GROUP.BROADCAST_FAIL_TO_ESTABLISH, {reason: 'FAIL_TO_ESTABLISH', group: group });
                            } else {
                                // 成团
                                var needWaiting = isDefineDeadline || (self.ctx.moment(group.assembling_time).unix() - self.ctx.moment().unix() > 0);
                                group.group_status = needWaiting ? DIC.TRV07.WAITING_TRAVEL: DIC.TRV07.TRAVELLING;
                                yield group.save();
                                self.ctx.socket_service.sendGroupChannelEvent(socketServerEvents.GROUP.BROADCAST_CHANGED, {reason: 'GROUP_STATUS_CHANGE_TO_' + (isDefineDeadline ? 'WAITING_TRAVEL' : 'TRAVELLING') , group: group });
                                if (needWaiting) {
                                    // 推迟更新
                                    self.addJobGroupChangeToTravelling(group.id, group.name, group.assembling_time);
                                }
                            }
                        } else {
                            // 推迟检测
                            self.addJobGroupDeadlineForRegistration(group.id, group.name, deadline);
                        }
                    } else if (group.group_status == DIC.TRV07.WAITING_TRAVEL) {
                        var isAssemblingTimeDueTo = self.ctx.moment(group.assembling_time).unix() - self.ctx.moment().unix() <= 0;
                        if (isAssemblingTimeDueTo) {
                            // 立即更新状态
                            group.group_status = DIC.TRV07.TRAVELLING;
                            yield group.save();
                            self.ctx.socket_service.sendGroupChannelEvent(socketServerEvents.GROUP.BROADCAST_CHANGED, {reason: 'GROUP_STATUS_CHANGE_TO_TRAVELLING', group: group });
                        } else {
                            // 推迟更新
                            self.addJobGroupChangeToTravelling(group.id, group.name, group.assembling_time);
                        }
                    }
                }
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    addJobGroupDeadlineForRegistration: function (group_id, name, deadline) {
        var self = this;
        var job_id = 'group_DEADLINE_FOR_REGISTRATION_' + group_id;
        var job_name = name + '=> 报名截止'
        var job_rule = deadline;
        self.ctx.jobManger.createJob(job_id, job_name, job_rule, () => {
            // 检测是否成团，发送不同消息
            return co(function *() {
                try {
                    var group = yield self.ctx.modelFactory().model_read(self.ctx.models['trv_group'], group_id);
                    if (group.group_status == DIC.TRV07.SIGN_UP) {
                        var isDefineDeadline = !!group.deadline;
                        if (group.participant_number < group.participate_min) {
                            //不成团
                            group.group_status = DIC.TRV07.INTERRUPTED;
                            yield group.save();
                            self.ctx.socket_service.sendGroupChannelEvent(socketServerEvents.GROUP.BROADCAST_FAIL_TO_ESTABLISH, {
                                reason: 'FAIL_TO_ESTABLISH',
                                group: group
                            });
                        } else {
                            // 成团
                            // todo 可以考虑将addJobGroupChangeToTravelling放到此处
                            var needWaiting = isDefineDeadline || (self.ctx.moment(group.assembling_time).unix() - self.ctx.moment().unix() > 0);
                            group.group_status = needWaiting ?  DIC.TRV07.WAITING_TRAVEL : DIC.TRV07.TRAVELLING;
                            yield group.save();
                            self.ctx.socket_service.sendGroupChannelEvent(socketServerEvents.GROUP.BROADCAST_CHANGED, {
                                reason: 'GROUP_STATUS_CHANGE_TO_' + (isDefineDeadline ? 'WAITING_TRAVEL' : 'TRAVELLING'),
                                group: group
                            });
                            
                            if (needWaiting) {
                                // 推迟更新
                                self.addJobGroupChangeToTravelling(group.id, group.name, group.assembling_time);
                            }
                        }
                    } else {
                        // 其他情形 可能是客户端或者用户主动更新
                    }
                }
                catch (e) {
                    console.log(e);
                    self.logger.error(e.message);
                }
            }).catch(self.ctx.coOnError);
        });
    },
    addJobGroupChangeToTravelling: function (group_id, name, assembling_time) {
        var self = this;
        var job_id = 'group_CHANGE_TO_TRAVELLING_' + group_id;
        var job_name = name + '=> 出行'
        var job_rule = assembling_time;
        self.ctx.jobManger.createJob(job_id, job_name, job_rule, () => {
            // 更新团状态从等待出行到出行中
            return co(function *() {
                try {
                    var group = yield self.ctx.modelFactory().model_read(self.ctx.models['trv_group'], group_id);
                    if (group.group_status == DIC.TRV07.WAITING_TRAVEL) {
                        group.group_status = DIC.TRV07.TRAVELLING;
                        yield group.save();
                        self.ctx.socket_service.sendGroupChannelEvent(socketServerEvents.GROUP.BROADCAST_CHANGED, {
                            reason: 'GROUP_STATUS_CHANGE_TO_TRAVELLING',
                            group: group
                        });
                    }
                }
                catch (e) {
                    console.log(e);
                    self.logger.error(e.message);
                }
            }).catch(self.ctx.coOnError);
        });
    }
};