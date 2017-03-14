/**
 * Created by zppro on 16-8-28.
 * 参考字典D1003-预定义树
 */

var statHelper = require('rfcore').factory('statHelper');

module.exports = {
    init: function (option) {
        var self = this;
        this.file = __filename;
        this.filename = this.file.substr(this.file.lastIndexOf('/') + 1);
        this.module_name = this.filename.substr(0, this.filename.lastIndexOf('.'));
        this.service_url_prefix = '/services/' + this.module_name.split('_').join('/');
        this.log_name = 'svc_' + this.filename;
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
                method: 'fetch-T',
                verb: 'get',
                url: this.service_url_prefix + "/T/:id",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var districts = require('../pre-defined/' + this.params.id + '.json');
                            this.body = app.wrapper.res.rows(districts);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'fetch-T0100',//周时间段
                verb: 'post',
                url: this.service_url_prefix + "/T0100",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var delta = this.request.body.where.delta || 0;
                            var f = (this.request.body.select || {}).format || 'MMDD(周E)';
                            var step = 7; //周段

                            console.log(this.request.body);

                            // var base = app.moment().add(delta*step,'days');
                            // console.log(base.day());
                            // var start = base.add(-1 * base.day(), 'days');
                            // console.log(start.format('E'));
                            // console.log(start.format('YYYYMMDD'));
                            var start = app.moment().weekday(delta* step);
                            console.log(start.format('YYYYMMDD'));
                            var rows = [{_id: start.day(), name: start.format(f), value: start.toDate()}];
                            for(var i=1,len=step;i<len;i++) {
                                var d = start.add(1, 'days');
                                rows.push({_id: d.day(), name: d.format(f).replace(/周7/, '周日'), value: d.toDate()});
                            }
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
                method: 'fetch-T1001',//针对比较少的节点，客户端过滤
                verb: 'get',
                url: this.service_url_prefix + "/T1001/:model/:select",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var modelOption = app.getModelOption(this);
                            this.body = app.wrapper.res.rows(yield app.modelFactory().query(modelOption.model_name, modelOption.model_path,
                                {where: {status: 1}, select: this.params.select || '_id name'}
                            ));
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'fetch-T1005',
                verb: 'get',
                url: this.service_url_prefix + "/T1005/:select",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            console.log('--------------> tree/T1005');
                            var distinctTypes = yield app.modelFactory().distinct('pub_order', '../models/pub/order', {select: 'type'});
                            var result = [];
                            var tenantGroupOption = {
                                TP: {
                                    name:'商户',
                                    where: {
                                        "type": {"$in": ['A0001', 'A0002', 'A0003']}
                                    }
                                },
                                TA: {
                                    name:'代理商',
                                    where: {
                                        "type": {"$in": ['A1001', 'A1002']}
                                    }
                                }
                            };

                            for(var i=0;i<distinctTypes.length;i++) {
                                var node = {_id: distinctTypes[i], name: tenantGroupOption[distinctTypes[i]].name};
                                node.children = yield app.modelFactory().query('pub_tenant', '../models/pub/tenant',
                                    {
                                        where: app._.defaults(tenantGroupOption[distinctTypes[i]].where, {status: 1}),
                                        select: this.params.select || '_id name'
                                    }
                                );
                                result.push(node);
                            }

                            this.body = app.wrapper.res.rows(result);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'fetch-T3001',//针对节点多，且需要服务端过滤
                verb: 'post',
                url: this.service_url_prefix + "/T3001/:model",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var modelOption = app.getModelOption(this);
                            var data = this.request.body;
                            if (!data.where)
                                data.where = {status: 1};
                            if (!data.select)
                                data.select = '_id name';
                            this.body = app.wrapper.res.rows(yield app.modelFactory().model_query(app.models[modelOption.model_name], data));
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'fetch-T3003',
                verb: 'post',
                url: this.service_url_prefix + "/T3003",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var data = this.request.body;
                            var tenantId = data.where.tenantId;
                            var floorSuffix = data.where.floorSuffix;
                            var bedNoSuffix = data.where.bedNoSuffix;

                            var districts = yield app.modelFactory().model_query(app.models['psn_district'], {
                                where: {
                                    status: 1,
                                    tenantId: tenantId
                                }, select: 'name '
                            });

                            var districtsObject = {};
                            app._.each(districts,function(o){
                                districtsObject[o._id] = o.name;
                            });

                            var rooms = yield app.modelFactory().model_query(app.models['psn_room'], {
                                where: {
                                    status: 1,
                                    tenantId: tenantId
                                }, select: 'name capacity floor districtId'
                            });

                            var districtFloorOfRooms = yield app.modelFactory().model_query(app.models['psn_room'], {
                                where: {
                                    status: 1,
                                    tenantId: tenantId
                                }, select: '-_id floor districtId'
                            });

                            var roomNameGroupByFloorAndDistrict = app._.chain(rooms).groupBy(function (o) {
                                return o.districtId + '$' + o.floor
                            }).map(function (o,k) {
                                var arr = app._.chain(o).map(function (o2) {
                                    //console.log(roomNameGroupByFloorAndDistrict[_idOfFloor][0]);
                                    var children = app._.chain(app._.range(1, o2.capacity + 1)).map(function (o3) {
                                        return {
                                            _id: o2.districtId + '$' + o2._id + '$' + o3,
                                            name: o3 + bedNoSuffix,
                                            capacity: o2.capacity
                                            //full_name: (districtsObject[o2.districtId]||o2.districtId) + '$' + o2.name + '$' + o3 + bedNoSuffix
                                        };
                                    }).value();
                                    return {_id: o2._id, name: o2.name, children: children, capacity: o2.capacity};
                                }).uniq('name').value();
                                var ret = {k: k, v: arr};
                                //console.log(ret);
                                return ret;
                            }).value();

                            var floorGroupByDistrict = app._.chain(districtFloorOfRooms).groupBy('districtId').map(function (o,k) {
                                var arr = app._.chain(o).map(function (o2) {
                                    var _idOfFloor = k + '$' + o2.floor;
                                    var nameOfFloor = o2.floor+floorSuffix;
                                    var children = (app._.find(roomNameGroupByFloorAndDistrict, function (o3) {
                                        return o3.k == _idOfFloor;
                                    }) || {}).v;
                                    return {_id:_idOfFloor,name:nameOfFloor,children:children};
                                }).uniq('name').value();

                                var ret = {k: k, v: arr};
                                return ret;
                            }).value();

                            var rows = app._.map(districts,function(o) {
                                var children = (app._.find(floorGroupByDistrict, function (o2) {
                                    return o2.k == o._id;
                                }) || {}).v;

                                //console.log(children);
                                return {_id: o._id, name: o.name, children: children};
                            });
                            console.log(districts);
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
                method: 'fetch-T3005',
                verb: 'post',
                url: this.service_url_prefix + "/T3005", // 房间可选机器人树
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var data = this.request.body;
                            var tenantId = data.where.tenantId;
                            var roomId = data.where.roomId;

                            var rooms = yield app.modelFactory().model_query(app.models['psn_room'], {
                                where: {
                                    status: 1,
                                    tenantId: tenantId
                                }, select: 'name nursing_robots'
                            });
                            rooms = app._.reject(rooms, function(o){return o.id == roomId;})
                            var assignedNursingRobots = [];
                            var dicNursingRobotToRoom = {};
                            app._.each(rooms, function(o){
                                app._.each(o.nursing_robots,function (o2) {
                                    var nursingRobotId = o2.toString();
                                    assignedNursingRobots.push(nursingRobotId);
                                    dicNursingRobotToRoom[nursingRobotId] = o.name;
                                });
                            });

                            var nursingRobots = yield app.modelFactory().model_query(app.models['psn_nursingRobot'], {
                                where: {
                                    status: 1,
                                    stop_flag: false
                                }, select: data.select || 'name'
                            });

                            var rows = app._.map(nursingRobots, function(o){
                                var nursingRobot = o.toObject();

                                nursingRobot.disableCheck = app._.contains(assignedNursingRobots, nursingRobot.id);
                                if (nursingRobot.disableCheck ) {
                                    nursingRobot.name += ' (正服务于' + dicNursingRobotToRoom[nursingRobot.id] + ')';
                                }
                                return nursingRobot;
                            });
                            // console.log(rows);
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
                method: 'fetch-T3007',
                verb: 'post',
                url: this.service_url_prefix + "/T3007", // 房间可选睡眠带树
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var data = this.request.body;
                            var tenantId = data.where.tenantId;
                            var roomId = data.where.roomId;

                            var rooms = yield app.modelFactory().model_query(app.models['psn_room'], {
                                where: {
                                    status: 1,
                                    tenantId: tenantId
                                }, select: 'name nursing_bedMonitors'
                            });
                            rooms = app._.reject(rooms, function(o){return o.id == roomId;})
                            var assignedNursingBedMonitors = [];
                            var dicNursingBedMonitorToRoom = {};
                            app._.each(rooms, function(o){
                                app._.each(o.nursing_bedMonitors,function (o2) {
                                    var nursingBedMonitorId = o2.nursingBedMonitorId.toString();
                                    assignedNursingBedMonitors.push(nursingBedMonitorId);
                                    dicNursingBedMonitorToRoom[nursingBedMonitorId] = o.name + '-' + o2.bed_no +'#床';
                                });
                            });

                            var nursingBedMonitors = yield app.modelFactory().model_query(app.models['psn_nursingBedMonitor'], {
                                where: {
                                    status: 1,
                                    stop_flag: false
                                },
                                select: data.select || 'name'
                            });

                            var rows = app._.map(nursingBedMonitors, function(o){
                                var nursingBedMonitor = o.toObject();
                                nursingBedMonitor.disableCheck = app._.contains(assignedNursingBedMonitors, nursingBedMonitor.id);

                                if (nursingBedMonitor.disableCheck ) {
                                    nursingBedMonitor.name = nursingBedMonitor.name + ' (正服务于' + dicNursingBedMonitorToRoom[nursingBedMonitor.id] + ')';
                                } else {
                                    nursingBedMonitor.name = nursingBedMonitor.code + ' [' + nursingBedMonitor.name + ']'
                                }
                                nursingBedMonitor.nursingBedMonitorId = nursingBedMonitor.id;

                                return nursingBedMonitor;
                            });
                            // console.log(rows);
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
                method: 'fetch-T3009',
                verb: 'post',
                url: this.service_url_prefix + "/T3009", // 区域,楼层,房间树
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var data = this.request.body;
                            var tenantId = data.where.tenantId;

                            var rows = [];

                            var districts = yield app.modelFactory().model_query(app.models['psn_district'], {
                                where: {
                                    status: 1,
                                    tenantId: tenantId
                                }, select: 'name'
                            });

                            var rooms = yield app.modelFactory().model_query(app.models['psn_room'], {
                                where: {
                                    status: 1,
                                    tenantId: tenantId
                                }, select: 'name floor districtId'
                            });

                            rows = districts.map((o) => {
                                var districtNode = {_id: o.id, name: o.name};
                                districtNode.children = app._.uniq(app._.where(rooms, (o1) => {
                                    return o1.districtId == districtNode._id;
                                }).map((o2) => {
                                    return o2.floor;
                                })).map((o3) => {
                                    var floorNode = {_id: "floor" +o3 + '#', name: o3  + '层'};
                                    floorNode.children = app._.filter(rooms, (o4) => {
                                        return o4.districtId == districtNode._id && o4.floor == o3;
                                    }).map((o5) => {
                                        return {_id: o5.id, name:o5.name}
                                    });
                                    return floorNode;
                                });
                                return districtNode;
                            })

                            // console.log(rows);
                            this.body = app.wrapper.res.rows(rows);

                        } catch (e) {
                            console.log(e);
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