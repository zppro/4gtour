/**
 * idt Created by zppro on 17-2-15.
 * 养老机构接口
 */
var DIC = require('../pre-defined/dictionary-constants.json');

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
            /**********************房间状态相关*****************************/
            {
                method: 'roomStatusInfo',
                verb: 'get',
                url: this.service_url_prefix + "/roomStatusInfo/:tenantId",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var roomStatuses = yield app.modelFactory().model_query(app.models['psn_roomStatus'], {where: {tenantId: this.params.tenantId}})
                                .populate({
                                    path: 'occupied.elderlyId',
                                    select: '-_id name'
                                });
                            this.body = app.wrapper.res.rows(roomStatuses);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'updateRoomStatusInfo',
                verb: 'post',
                url: this.service_url_prefix + "/updateRoomStatusInfo",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var tenant,elderly,room;
                        var remove_created_roomStatus_id,raw_bed_status_for_cancel_occupy_roomStatus,raw_elderly_for_cancel_occupy_roomStatus;
                        var cancel_occupy, cancel_occupy_roomStatus;
                        try {
                            //this.request.body
                            var tenantId = this.request.body.tenantId;
                            var roomId = this.request.body.roomId;
                            var bed_no = this.request.body.bed_no;
                            var elderlyId = this.request.body.elderlyId;

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到租户!'});
                                yield next;
                                return;
                            }
                            elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], elderlyId);
                            if(!elderly || elderly.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                yield next;
                                return;
                            }
                            room =  yield app.modelFactory().model_read(app.models['psn_room'], roomId);
                            if(!room || room.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到房间资料资料!'});
                                yield next;
                                return;
                            }
                            if(Number(bed_no) > room.capacity) {
                                this.body = app.wrapper.res.error({message: '无效的床位号，该房间最多支持'+room.capacity+'床位!'});
                                yield next;
                                return;
                            }
                            console.log('前置检查完成');

                            //检查入住老人有没有其他的预占用或在用记录
                            var toUpdateRoomStatus = [];
                            var toCreateRoomStatus;
                            var roomStatuses  = yield app.modelFactory().model_query(app.models['psn_roomStatus'], {where: {tenantId: tenantId}});
                            for(var i=0;i<roomStatuses.length;i++) {
                                if(roomStatuses[i].occupied){
                                    for(var j=0;j<roomStatuses[i].occupied.length;j++){

                                        var occupy = roomStatuses[i].occupied[j];
                                        if (elderlyId == occupy.elderlyId) {
                                            if (occupy.bed_status == 'A0003') {
                                                this.body = app.wrapper.res.error({message: '该老人已经入住到其他床位，请使用换床功能!!'});
                                                yield next;
                                                return;
                                            }

                                            raw_bed_status_for_cancel_occupy_roomStatus = occupy.bed_status;
                                            raw_elderly_for_cancel_occupy_roomStatus = occupy.elderlyId;
                                            cancel_occupy = occupy;
                                            cancel_occupy_roomStatus = roomStatuses[i];

                                            occupy.bed_status = 'A0001';
                                            occupy.elderlyId = undefined;

                                            console.log(roomStatuses[i]);
                                            toUpdateRoomStatus.push(roomStatuses[i]);

                                        }
                                    }
                                }
                            }


                            var roomStatus;
                            for(var i=0;i<roomStatuses.length;i++){
                                if(roomId == roomStatuses[i].roomId){
                                    roomStatus = roomStatuses[i];
                                    break;
                                }
                            }

                            if(!roomStatus) {
                                console.log('create:'+roomId);
                                toCreateRoomStatus = {
                                    roomId: roomId,
                                    occupied: [{bed_no: bed_no, bed_status: 'A0002', elderlyId: elderlyId}],
                                    tenantId: tenantId
                                };
                            }
                            else{
                                var bedInfo1
                                for(var i=0;i<roomStatus.occupied.length;i++){
                                    if(bed_no == roomStatus.occupied[i].bed_no){
                                        bedInfo1 = roomStatus.occupied[i];
                                    }
                                }

                                if(!bedInfo1){
                                    roomStatus.occupied.push({bed_no: bed_no,bed_status:'A0002', elderlyId: elderlyId});
                                }
                                else {
                                    //判断要入住的床位是否有其他老人，如有其他老人已经预占则返回
                                    if (bedInfo1.elderlyId && bedInfo1.elderlyId != elderlyId) {
                                        //改成
                                        this.body = app.wrapper.res.error({message: '该床位已经被占用，请刷新床位信息!'});
                                        yield next;
                                        return;
                                    }
                                    bedInfo1.bed_status = 'A0002';
                                    bedInfo1.elderlyId = elderlyId;

                                }

                                toUpdateRoomStatus.push(roomStatus);
                            }

                            if(toCreateRoomStatus) {
                                remove_created_roomStatus_id =  (yield app.modelFactory().model_create(app.models['psn_roomStatus'], toCreateRoomStatus))._id;
                                steps = 'A';
                            }

                            for(var i=0;i<toUpdateRoomStatus.length;i++) {
                                yield toUpdateRoomStatus[i].save();
                                steps += "A";
                            }
                            this.body = app.wrapper.res.default();
                        }
                        catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps){
                                for(var i=0;i<steps.length;i++) {
                                    switch(i) {
                                        case 0:
                                            yield app.modelFactory().model_delete(app.models['psn_roomStatus'], remove_created_roomStatus_id)
                                            break;
                                        case 1:
                                            if (cancel_occupy_roomStatus) {
                                                cancel_occupy.bed_status = raw_bed_status_for_cancel_occupy_roomStatus;
                                                cancel_occupy.elderlyId = raw_elderly_for_cancel_occupy_roomStatus;
                                            }
                                            yield cancel_occupy_roomStatus.save();
                                            break;
                                    }
                                }
                            }
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'tenantChargeItemCustomizedAsTree',
                verb: 'get',
                url: this.service_url_prefix + "/tenantChargeItemCustomizedAsTree/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenantId = this.params._id;
                            var tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }

                            var chargeItems = yield app.modelFactory().model_query(app.models['psn_chargeItemCustomized'], {
                                where: {
                                    status: 1,
                                    tenantId: tenantId
                                }
                            });

                            var charge_standard = (tenant.charge_standard || 'S1');

                            var ret = {
                                _id: app.modelVariables.PSN.CHARGE_ITEM_CUSTOMIZED_CATAGORY._ID + '-' + charge_standard,
                                name: app.modelVariables.CHARGE_ITEM_CUSTOMIZED_CATAGORY.NAME,
                                children: []
                            };

                            var item_id_prefix = ret._id.toLowerCase() + '.';

                            for (var i = 0; i < chargeItems.length; i++) {
                                if ((chargeItems[i].catagory + '-' + charge_standard) == ret._id)
                                    ret.children.push({
                                        _id: item_id_prefix + chargeItems[i]._id,
                                        name: chargeItems[i].name,
                                        data: {manual_seletable: true}
                                    });
                            }
                            this.body = app.wrapper.res.ret(ret);
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