/**
 * Created by zppro on 17-4-7.
 * 养老平台移动接口 pension agency center
 */
var rp = require('request-promise-native');
var DIC = require('../pre-defined/dictionary-constants.json');
module.exports = {
    init: function (option) {
        var self = this;
        this.file = __filename;
        this.filename = this.file.substr(this.file.lastIndexOf('/') + 1);
        this.module_name = this.filename.substr(0, this.filename.lastIndexOf('.'));
        this.service_url_prefix = '/me-services/' + this.module_name.split('_').join('/');
        this.log_name = 'mesvc_' + this.filename;
        option = option || {};

        this.logger = require('log4js').getLogger(this.log_name);

        if (!this.logger) {
            console.error('logger not loaded in ' + this.file);
        }
        else {
            this.logger.info(this.file + " loaded!");
        }

        this.actions = [
            {
                method: 'robot$workitem$fetch',
                verb: 'post',
                url: this.service_url_prefix + "/robot/workitem/fetch",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var robot_code = this.robot_code;
                            console.log("robot_code:", robot_code);
                            self.logger.info("robot_code:" +  (robot_code || 'not found'));
                            console.log("body:", this.request.body);
                            self.logger.info("body:" +  this.request.body);
                            var robot, tenantId, rooms, roomIds;
                            robot = yield app.modelFactory().model_one(app.models['pub_robot'], {
                                where:{
                                    status: 1,
                                    code: robot_code
                                }
                            });
                            if (!robot) {
                                this.body = app.wrapper.res.error({message: '无效的机器人编号'});
                            }

                            // 通过机器人->房间->护理等级
                            tenantId = robot.tenantId;

                            rooms = yield app.modelFactory().model_query(app.models['psn_room'], {
                                select: '_id',
                                where: {
                                    roomId: roomId,
                                    tenantId: tenantId
                                },
                                sort: 'exec_on'
                            });

                            roomIds = app._.map(rooms, function (o) {
                                return o._id;
                            });

                            var today = app.moment(app.moment().format('YYYY-MM-DD') + " 00:00:00");
                            var rows = yield app.modelFactory().model_query(app.models['psn_nursingRecord'], {
                                select: 'exec_on executed_flag name description duration assigned_worker confirmed_flag confirmed_on workItemId voice_content',
                                where: {
                                    roomId: {$in: roomIds},
                                    robots: {$elemMatch: robot._id},
                                    tenantId: tenantId
                                },
                                sort: 'exec_on'
                            }).populate('assigned_worker').populate('workItemId');
                            console.log(rows);

                            this.body = app.wrapper.res.rows(rows);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'robot$workitem$exec',
                verb: 'post',
                url: this.service_url_prefix + "/robot/workitem/exec",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var robot_code = this.robot_code  || 'not found';
                            console.log("robot_code:", robot_code);
                            self.logger.info("robot_code:" +  (robot_code || 'not found'));
                            console.log("body:", this.request.body);
                            self.logger.info("body:" +  this.request.body);
                            var nursingRecordId = this.request.body.nursingRecordId;
                            console.log('nursingRecordId:', nursingRecordId);

                            var robot, tenantId, nursingRecord, roomIds;
                            robot = yield app.modelFactory().model_one(app.models['pub_robot'], {
                                where:{
                                    status: 1,
                                    code: robot_code
                                }
                            });
                            if (!robot) {
                                this.body = app.wrapper.res.error({message: '无效的机器人编号'});
                                return;
                            }

                            // 通过机器人->房间->护理等级
                            tenantId = robot.tenantId;
                            nursingRecord = yield app.modelFactory().model_read(app.models['psn_nursingRecord'], nursingRecordId);
                            if (!nursingRecord) {
                                this.body = app.wrapper.res.error({message: '无效的服务项目记录'});
                                return;
                            }

                            nursingRecord.executed_flag = true;
                            yield nursingRecord.save();

                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'robot$workitem$confirm',
                verb: 'post',
                url: this.service_url_prefix + "/robot/workitem/confirm",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var robot_code = this.robot_code  || 'not found';
                            console.log("robot_code:", robot_code);
                            self.logger.info("robot_code:" +  (robot_code || 'not found'));
                            console.log("body:", this.request.body);
                            self.logger.info("body:" +  this.request.body);
                            var nursingRecordId = this.request.body.nursingRecordId;
                            console.log('nursingRecordId:', nursingRecordId);

                            var robot, tenantId, nursingRecord, roomIds;
                            robot = yield app.modelFactory().model_one(app.models['pub_robot'], {
                                where:{
                                    status: 1,
                                    code: robot_code
                                }
                            });
                            if (!robot) {
                                this.body = app.wrapper.res.error({message: '无效的机器人编号'});
                                return;
                            }

                            // 通过机器人->房间->护理等级
                            tenantId = robot.tenantId;
                            nursingRecord = yield app.modelFactory().model_read(app.models['psn_nursingRecord'], nursingRecordId);
                            if (!nursingRecord) {
                                this.body = app.wrapper.res.error({message: '无效的服务项目记录'});
                                return;
                            }

                            nursingRecord.confirmed_flag = true;
                            nursingRecord.confirmed_on = app.moment();

                            yield nursingRecord.save();

                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            }
        ];

        return this;
    }
}.init();
//.init(option);