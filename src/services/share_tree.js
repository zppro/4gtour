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
                            var dateFormat = 'YYYY-MM-DD';

                            console.log('T0100:',this.request.body);

                            // var base = app.moment().add(delta*step,'days');
                            // console.log(base.day());
                            // var start = base.add(-1 * base.day(), 'days');
                            // console.log(start.format('E'));
                            // console.log(start.format('YYYYMMDD'));
                            var start = app.moment().weekday(delta* step);
                            var rows = [{_id: start.day(), name: start.format(f), value: start.format(dateFormat)}];
                            for(var i=1,len=step;i<len;i++) {
                                var d = start.add(1, 'days');
                                rows.push({_id: d.day(), name: d.format(f).replace(/周7/, '周日'), value: d.format(dateFormat)});
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
                                }, select: 'name robots'
                            });
                            rooms = app._.reject(rooms, function(o){return o.id == roomId;})
                            var assignedRobots = [];
                            var dicRobotToRoom = {};
                            app._.each(rooms, function(o){
                                app._.each(o.robots,function (o2) {
                                    var robotId = o2.toString();
                                    assignedRobots.push(robotId);
                                    dicRobotToRoom[robotId] = o.name;
                                });
                            });

                            var robots = yield app.modelFactory().model_query(app.models['pub_robot'], {
                                where: {
                                    status: 1,
                                    stop_flag: false
                                }, select: data.select || 'name'
                            });

                            var rows = app._.map(robots, function(o){
                                var robot = o.toObject();

                                robot.disableCheck = app._.contains(assignedRobots, robot.id);
                                if (robot.disableCheck ) {
                                    robot.name += ' (正服务于' + dicRobotToRoom[robot.id] + ')';
                                }
                                return robot;
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
                                }, select: 'name bedMonitors'
                            });
                            rooms = app._.reject(rooms, function(o){return o.id == roomId;})
                            var assignedBedMonitors = [];
                            var dicBedMonitorToRoom = {};
                            app._.each(rooms, function(o){
                                app._.each(o.bedMonitors,function (o2) {
                                    var bedMonitorId = o2.bedMonitorId.toString();
                                    assignedBedMonitors.push(bedMonitorId);
                                    dicBedMonitorToRoom[bedMonitorId] = o.name + '-' + o2.bed_no +'#床';
                                });
                            });

                            var bedMonitors = yield app.modelFactory().model_query(app.models['pub_bedMonitor'], {
                                where: {
                                    status: 1,
                                    stop_flag: false
                                },
                                select: data.select || 'name'
                            });

                            var rows = app._.map(bedMonitors, function(o){
                                var bedMonitor = o.toObject();
                                bedMonitor.disableCheck = app._.contains(assignedBedMonitors, bedMonitor.id);

                                if (bedMonitor.disableCheck ) {
                                    bedMonitor.name = bedMonitor.name + ' (正服务于' + dicBedMonitorToRoom[bedMonitor.id] + ')';
                                }
                                bedMonitor.bedMonitorId = bedMonitor.id;

                                return bedMonitor;
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
                method: 'fetch-T3008',
                verb: 'post',
                url: this.service_url_prefix + "/T3008", // 区域,楼层
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
                                }, select: 'name floor capacity districtId'
                            });

                            rows = districts.map((o) => {
                                var districtNode = {_id: o.id, name: o.name};
                                districtNode.children = app._.uniq(app._.where(rooms, (o1) => {
                                    return o1.districtId == districtNode._id;
                                }).map((o2) => {
                                    return o2.floor;
                                })).map((o3) => {
                                    return {_id: o.id + '$' + o3, name: o3 + '层'};
                                });
                                return districtNode;
                            });

                            console.dir(rows);
                            this.body = app.wrapper.res.rows(rows);

                        } catch (e) {
                            console.log(e);
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
                                }, select: 'name floor capacity districtId'
                            });

                            rows = districts.map((o) => {
                                var districtNode = {_id: o.id, name: o.name};
                                districtNode.children =  app._.compact(app._.uniq(app._.where(rooms, (o1) => {
                                    return o1.districtId == districtNode._id;
                                }).map((o2) => {
                                    // console.log('o2:', o2);
                                    return o2.floor;
                                })).map((o3) => {
                                    var floorNode = {_id: "floor" +o3 + '#', name: o3  + '层'};
                                    floorNode.children = app._.filter(rooms, (o4) => {
                                        return o4.districtId == districtNode._id && o4.floor == o3;
                                    }).map((o5) => {
                                        return {_id: o5.id, name: o5.name, capacity: o5.capacity}
                                    });
                                    if (floorNode.children.length > 0) {
                                        return floorNode;
                                    } else {
                                        return null;
                                    }
                                }));
                                return districtNode;
                            });

                            // console.dir(rows);
                            // app.clog.log(self.logger, 'T3009:', rows);
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