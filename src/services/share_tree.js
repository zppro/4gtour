/**
 * Created by zppro on 16-8-28.
 * 参考字典D1003-预定义树
 */

module.exports = {
    init: function (option) {
        var self = this;
        this.file = __filename;
        this.filename = this.file.substr(this.file.lastIndexOf('/') + 1);
        this.module_name = this.filename.substr(0, this.filename.lastIndexOf('.'));
        this.service_url_prefix = '/services/' + this.module_name.split('_').join('/');

        option = option || {};

        this.logger = require('log4js').getLogger(this.filename);

        if (!this.logger) {
            console.error('logger not loaded in ' + this.file);
        }
        else {
            this.logger.info(this.file + " loaded!");
        }

        this.actions = [
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
                                    name:'旅行社',
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
                            this.body = app.wrapper.res.rows(yield app.modelFactory().query(modelOption.model_name, modelOption.model_path, data));
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

                            var tenantModelOption = {model_name: 'pub_tenant', model_path: '../models/pub/tenant'};
                            var districtModelOption = {model_name: 'pfta_district', model_path: '../models/pfta/district'};
                            var roomModelOption = {model_name: 'pfta_room', model_path: '../models/pfta/room'};

                            var data = this.request.body;

                            var tenantId = data.where.tenantId;
                            var floorSuffix = data.where.floorSuffix;
                            var bedNoSuffix = data.where.bedNoSuffix;

                            var districts = yield app.modelFactory().query(districtModelOption.model_name, districtModelOption.model_path, {
                                where: {
                                    status: 1,
                                    tenantId: tenantId
                                }, select: 'name '
                            });

                            var districtsObject = {};
                            app._.each(districts,function(o){
                               districtsObject[o._id] = o.name;
                            });

                            var rooms = yield app.modelFactory().query(roomModelOption.model_name, roomModelOption.model_path, {
                                where: {
                                    status: 1,
                                    tenantId: tenantId
                                }, select: 'name capacity floor districtId'
                            });

                            var districtFloorOfRooms = yield app.modelFactory().query(roomModelOption.model_name, roomModelOption.model_path, {
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

                            this.body = app.wrapper.res.rows(rows);
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