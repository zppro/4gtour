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
            /**********************老人相关*****************************/
            {
                method: 'queryElderly',
                verb: 'post',
                url: this.service_url_prefix + "/q/elderly",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenantId = this.request.body.tenantId;
                            var keyword = this.request.body.keyword;
                            var data = this.request.body.data;

                            app._.extend(data.where,{
                                status: 1,
                                tenantId: tenantId
                            });

                            if(keyword){
                                data.where.name = new RegExp(keyword);
                            }
                            console.log(data);
                            var rows = yield app.modelFactory().model_query(app.models['psn_elderly'], data);
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
                method: 'elderlyInfo',
                verb: 'get',
                url: this.service_url_prefix + "/elderlyInfo/:_id/:select",//:select需要提取的字段域用逗号分割 e.g. name,type
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], this.params._id);
                            var ret = app._.pick(elderly.toObject(),this.params.select.split(','));
                            this.body = app.wrapper.res.ret(ret);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'changeElderlyRoomBed',
                verb: 'post',
                url: this.service_url_prefix + "/changeElderlyRoomBed",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var tenant,elderly,room;
                        var oldRoomStatus,newRoomStatus,updateRoomStatus,old_roomOccupancyChangeHistory,new_roomOccupancyChangeHistory;
                        var raw_elderly_room_value,raw_elderly_room_summary,raw_updateRoomStatus_occupied,raw_bed_status_for_cancel_occupy_roomStatus,raw_elderly_for_cancel_occupy_roomStatus,raw_in_flag;
                        var cancel_occupy;
                        try {
                            //this.request.body
                            var tenantId = this.request.body.tenantId;
                            var elderlyId = this.request.body.elderlyId;
                            var roomId = this.request.body.roomId;
                            var bed_no = Number(this.request.body.bed_no);

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
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
                                this.body = app.wrapper.res.error({message: '无法找到搬入房间资料!'});
                                yield next;
                                return;
                            }

                            var district = yield app.modelFactory().model_read(app.models['psn_district'], room.districtId);
                            if(!district || district.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到搬入房间所在区域资料!'});
                                yield next;
                                return;
                            }
                            if(bed_no > room.capacity) {
                                this.body = app.wrapper.res.error({message: '无效的床位号，该房间最多支持'+room.capacity+'床位!'});
                                yield next;
                                return;
                            }

                            var elderly_json = elderly.toObject();
                            raw_elderly_room_value = app.clone(elderly_json.room_value);
                            raw_elderly_room_summary = elderly_json.room_summary;

                            if(raw_elderly_room_value.roomId == roomId && raw_elderly_room_value.bed_no == bed_no){
                                this.body = app.wrapper.res.error({message: '房间床位没有变化!'});
                                yield next;
                                return;
                            }



                            //检查入住老人有没有其他的预占用或在用记录
                            console.log(raw_elderly_room_value.roomId.toString());
                            var oldRoomStatuses = yield app.modelFactory().model_query(app.models['psn_roomStatus'], {where: {tenantId: tenantId,roomId:raw_elderly_room_value.roomId}});
                            if(oldRoomStatuses.length == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人搬离房间床位信息!'});
                                yield next;
                                return;
                            }
                            else {
                                oldRoomStatus = oldRoomStatuses[0];
                            }
                            if(!oldRoomStatus.occupied){
                                this.body = app.wrapper.res.error({message: '无法找到老人搬离房间床位信息!'});
                                yield next;
                                return;
                            }
                            var foundOccupy = false;
                            for(var j=0;j<oldRoomStatus.occupied.length;j++){
                                var occupy = oldRoomStatus.occupied[j];

                                if (occupy.bed_no == raw_elderly_room_value.bed_no &&  elderlyId == occupy.elderlyId) {
                                    foundOccupy = true;
                                    if (occupy.bed_status == 'A0002') {
                                        this.body = app.wrapper.res.error({message: '该老人旧床位仅仅被预占用，请使用修改预占用床位功能!'});
                                        yield next;
                                        return;
                                    }

                                    //rollback用
                                    raw_bed_status_for_cancel_occupy_roomStatus = occupy.bed_status;
                                    raw_elderly_for_cancel_occupy_roomStatus = occupy.elderlyId;
                                    cancel_occupy = occupy;

                                    occupy.bed_status = 'A0001';
                                    occupy.elderlyId = undefined;
                                }
                            }

                            if(!foundOccupy){
                                this.body = app.wrapper.res.error({message: '无法找到老人原来的房间床位信息!'});
                                yield next;

                                return;
                            }
                            console.log('前置检查完成');

                            //修改room_summary,room_value
                            elderly.room_value.districtId = room.districtId;
                            elderly.room_value.roomId = roomId;
                            elderly.room_value.bed_no = bed_no;
                            elderly.room_summary = district.name + '-'+room.floor+'F-'+room.name+'-'+bed_no+'#床';

                            var newRoomStatuses = yield app.modelFactory().model_query(app.models['psn_roomStatus'], {where: {tenantId: tenantId,roomId:roomId}});
                            if(newRoomStatuses.length == 0) {
                                newRoomStatus = {
                                    roomId: roomId,
                                    occupied: [{bed_no: bed_no, bed_status: 'A0003', elderlyId: elderlyId}],
                                    tenantId: tenantId
                                };
                            }
                            else {
                                updateRoomStatus = newRoomStatuses[0];

                                //rollback用
                                raw_updateRoomStatus_occupied = app.clone(updateRoomStatus.toObject().occupied);

                                var bedInfo1;
                                if (updateRoomStatus.occupied) {
                                    for (var i = 0; i < updateRoomStatus.occupied.length; i++) {
                                        if (bed_no == updateRoomStatus.occupied[i].bed_no) {
                                            bedInfo1 = updateRoomStatus.occupied[i];
                                        }
                                    }
                                }

                                if (!bedInfo1) {
                                    updateRoomStatus.occupied.push({
                                        bed_no: bed_no,
                                        bed_status: 'A0003',
                                        elderlyId: elderlyId
                                    });
                                }
                                else {
                                    //判断要入住的床位是否有其他老人，如有其他老人已经预占则返回
                                    if (bedInfo1.elderlyId) {
                                        //改成
                                        this.body = app.wrapper.res.error({message: '该床位已经被占用，请刷新床位信息!'});
                                        yield next;
                                        return;
                                    }
                                    bedInfo1.bed_status = 'A0003';
                                    bedInfo1.elderlyId = elderlyId;
                                }
                            }



                            //修改旧的占用历史(in_flag改为搬离，并设置搬离时间)
                            console.log(raw_elderly_room_value.roomId);
                            console.log(elderlyId);
                            var roomOccupancyChangeHistories = yield app.modelFactory().model_query(app.models['psn_roomOccupancyChangeHistory'], {where: {tenantId: tenantId,roomId:raw_elderly_room_value.roomId,bed_no:raw_elderly_room_value.bed_no,elderlyId:elderlyId,in_flag:true},sort:{check_in_time:-1}});
                            console.log(roomOccupancyChangeHistories);
                            if(roomOccupancyChangeHistories && roomOccupancyChangeHistories.length>0) {
                                old_roomOccupancyChangeHistory = roomOccupancyChangeHistories[0];
                                raw_in_flag = old_roomOccupancyChangeHistory.in_flag;
                                old_roomOccupancyChangeHistory.in_flag = false;
                                old_roomOccupancyChangeHistory.check_out_time = app.moment();
                            }
                            else {
                                this.body = app.wrapper.res.error({message: '无法找到旧的房间占用历史!'});
                                yield next;
                                return;
                            }

                            //增加新的占用记录
                            new_roomOccupancyChangeHistory = {
                                roomId: roomId,
                                room_summary: elderly.room_summary,
                                bed_no: bed_no,
                                elderlyId: elderly._id,
                                elderly_summary: elderly.name + ' ' + elderly.id_no,
                                in_flag: true,
                                tenantId: tenantId
                            };

                            yield elderly.save();
                            steps="A";

                            if(cancel_occupy){
                                yield oldRoomStatus.save();
                            }
                            steps += 'A';

                            if(newRoomStatus) {
                                newRoomStatus =  yield app.modelFactory().model_create(app.models['psn_roomStatus'], newRoomStatus);
                            }
                            else if(updateRoomStatus){
                                yield updateRoomStatus.save();
                            }
                            steps += 'A';
                            if(old_roomOccupancyChangeHistory){
                                yield old_roomOccupancyChangeHistory.save();
                            }
                            steps += 'A';

                            new_roomOccupancyChangeHistory = yield app.modelFactory().model_create(app.models['psn_roomOccupancyChangeHistory'], new_roomOccupancyChangeHistory);
                            steps += 'A';

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
                                            elderly.room_value = raw_elderly_room_value;
                                            elderly.room_summary = raw_elderly_room_summary;
                                            yield elderly.save();
                                            break;
                                        case 1:
                                            if (cancel_occupy) {
                                                cancel_occupy.bed_status = raw_bed_status_for_cancel_occupy_roomStatus;
                                                cancel_occupy.elderlyId = raw_elderly_for_cancel_occupy_roomStatus;
                                                yield oldRoomStatus.save();
                                            }
                                            break;
                                        case 2:
                                            if (newRoomStatus) {
                                                yield app.modelFactory().model_delete(app.models['pfta_roomStatus'], newRoomStatus._id);
                                            }
                                            else if (updateRoomStatus) {
                                                updateRoomStatus.occupied = raw_updateRoomStatus_occupied;
                                                yield updateRoomStatus.save();
                                            }
                                            break;
                                        case 3:
                                            if (old_roomOccupancyChangeHistory) {
                                                old_roomOccupancyChangeHistory.in_flag = raw_in_flag;
                                                yield old_roomOccupancyChangeHistory.save();
                                            }
                                            break;
                                        //case 4:
                                        //    if(new_roomOccupancyChangeHistory) {
                                        //        yield app.modelFactory().model_delete(app.models['pfta_roomOccupancyChangeHistory'], new_roomOccupancyChangeHistory._id);
                                        //    }
                                    }
                                }
                            }
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'changeElderlyChargeItem',
                verb: 'post',
                url: this.service_url_prefix + "/changeElderlyChargeItem",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var tenant,elderly,charge_item;
                        var journal_account_item_A0003,journal_account_item_B0001,tenantJournalAccount_B0006,tenantJournalAccount_A0001;
                        var remove_elderly_charge_item_change_history_id,remove_tenantJournalAccount_B0006_id,remove_tenantJournalAccount_A0001_id;
                        var summary_key;
                        var raw_elderly_charging_on_of_monthly_prepay,old_elderly_charge_item_change_history,old_elderly_charge_items, old_elderly_journal_account,old_elderly_subsidiary_ledger,
                            old_elderly_charge_item_catalog_summary,old_tenant_subsidiary_ledger;
                        try {
                            var tenantId = this.request.body.tenantId;
                            var elderlyId = this.request.body.elderlyId;
                            var charge_item_catalog_id = this.request.body.charge_item_catalog_id;
                            var old_charge_item_id = this.request.body.old_charge_item_id;
                            var new_charge_item = this.request.body.new_charge_item;

                            var arr_old_charge_item_id = old_charge_item_id.split('.');
                            var arr_new_charge_item_id = new_charge_item.item_id.split('.');
                            if(arr_old_charge_item_id.slice(0,arr_old_charge_item_id.length-1).join('.')!= arr_new_charge_item_id.slice(0,arr_new_charge_item_id.length-1).join('.')) {
                                this.body = app.wrapper.res.error({message: '更改的收费项目不是统一个收费类别下!'});
                                yield next;
                                return;
                            }

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }
                            elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], elderlyId);
                            if(!elderly || elderly.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }

                            charge_item = app._.findWhere(elderly.charge_items, {item_id: old_charge_item_id});
                            if(!charge_item) {
                                this.body = app.wrapper.res.error({message: '该老人数据中无法找到收费项目!'});
                                yield next;
                                return;
                            }

                            var tenant_json = tenant.toObject();
                            var elderly_json = elderly.toObject();
                            console.log('前置检查完成');

                            raw_elderly_charging_on_of_monthly_prepay =app.clone(elderly_json.charging_on_of_monthly_prepay);

                            //算法1，将旧收费项目中止，并计算退款，然后按照新收费项目重新按月预收
                            //计算预付月收费日
                            var firstPrepayDate = elderly.charging_on_of_monthly_prepay;
                            if(!firstPrepayDate) {
                                var arr_journal_account_B0001 = app._.where(elderly_json.journal_account, {revenue_and_expenditure_type: 'B0001'});
                                var latest_journal_account_B0001 = app._.max(arr_journal_account_B0001, function (item) {
                                    return item.check_in_time;
                                });
                                firstPrepayDate = latest_journal_account_B0001.check_in_time;
                            }

                            var daysOfMonthOnAverage = 30;

                            var except_old_monthly_prepay_price = 0;
                            var old_monthly_prepay_price = 0;
                            app._.each(elderly.charge_items,function(item) {
                                if (item.item_id != charge_item.item_id) {
                                    except_old_monthly_prepay_price += item.period_price;
                                }
                            });
                            old_monthly_prepay_price = except_old_monthly_prepay_price + charge_item.period_price;
                            var new_monthly_prepay_price = except_old_monthly_prepay_price+ new_charge_item.period_price;
                            var old_charge_item_day_price = old_monthly_prepay_price / daysOfMonthOnAverage;

                            ////->放弃从历史记录中计算变化的月租预付计费时间而是直接从elderly读取
                            //if(elderly.charge_item_change_history && elderly.charge_item_change_history.length>0) {
                            //    var latestChangeRecord = app._.max(app._.where(elderly.charge_item_change_history, {charge_item_catalog_id: charge_item_catalog_id}),
                            //        function (item) {
                            //            return item.check_in_time;
                            //        });
                            //    latestChangeRecord && (firstPrepayDate = latestChangeRecord.check_in_time);
                            //}


                            //当月周期未住满的天数
                            var remainder = daysOfMonthOnAverage - app.moment().diff(firstPrepayDate,'days') % daysOfMonthOnAverage;
                            var refund = (old_charge_item_day_price * remainder).toFixed(2);
                            console.log(refund);
                            old_elderly_journal_account = app.clone(elderly_json.journal_account);

                            //预付月租退款(按天计算)
                            journal_account_item_A0003 = {
                                voucher_no: yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.BOOKING_TO_TENANT,elderly_json.tenantId),
                                revenue_and_expenditure_type: 'A0003',
                                digest: app.moment().format('YYYY-MM-DD') + ':' + charge_item.item_name + '->' + new_charge_item.item_name + '重新计费,并退回' + remainder + '天预收款',
                                amount: refund
                            };

                            //变化后的预付月租
                            journal_account_item_B0001 = {
                                voucher_no: yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.BOOKING_TO_TENANT,elderly_json.tenantId),
                                revenue_and_expenditure_type: 'B0001',
                                digest: app.moment().format('YYYY-MM-DD') + ':' + charge_item.item_name + '->' + new_charge_item.item_name + '重新计费',
                                amount: new_monthly_prepay_price * 1
                            };

                            //记录老人流水账
                            elderly.journal_account.push(journal_account_item_A0003);
                            elderly.journal_account.push(journal_account_item_B0001);

                            //修改老人明细账
                            old_elderly_subsidiary_ledger = app.clone(elderly_json.subsidiary_ledger);
                            elderly.subsidiary_ledger.self += journal_account_item_A0003.amount - journal_account_item_B0001.amount;

                            //修改月租预付重新计费时间
                            elderly.charging_on_of_monthly_prepay = app.moment();//更新月租预付的计费时间

                            //增加老人收费项目变动历史
                            old_elderly_charge_item_change_history = app.clone(elderly_json.charge_item_change_history);
                            var charge_item_change_record = {
                                charge_item_catalog_id: charge_item_catalog_id,
                                old_item_id: charge_item.item_id,
                                old_item_name: charge_item.item_name,
                                old_period_price: charge_item.period_price,
                                old_period: charge_item.period,
                                new_item_id: new_charge_item.item_id,
                                new_item_name: new_charge_item.item_name,
                                new_period_price: new_charge_item.period_price,
                                new_period: new_charge_item.period
                            };
                            elderly.charge_item_change_history.push(charge_item_change_record);

                            //修改老人收费项目
                            old_elderly_charge_items =  app.clone(elderly_json.charge_items);
                            charge_item.item_id = new_charge_item.item_id;
                            charge_item.item_name = new_charge_item.item_name;
                            charge_item.period_price = new_charge_item.period_price;
                            charge_item.period = new_charge_item.period;

                            //除了房间床位分类，其他根据不同收费分类重新设置老人项目汇总信息
                            var new_charge_item_catalog_name = arr_new_charge_item_id[arr_new_charge_item_id.length-2].toLowerCase().replace('-'+elderly.charge_standard.toLowerCase(),'');


                            if(new_charge_item_catalog_name!='room') {
                                summary_key = new_charge_item_catalog_name + '_summary';
                                old_elderly_charge_item_catalog_summary = elderly[summary_key];
                                elderly[summary_key] = new_charge_item.item_name;
                            }

                            //记录租户流水账
                            tenantJournalAccount_B0006 = {
                                voucher_no : journal_account_item_A0003.voucher_no,
                                revenue_and_expenditure_type: 'B0006',
                                digest: elderly.name + ' ' + journal_account_item_A0003.digest,
                                amount: journal_account_item_A0003.amount,
                                source_type: app.modelVariables.SOURCE_TYPES.ELDERLY,
                                source_id: elderly._id,
                                source_key: '$journal_account.voucher_no',
                                tenantId: elderly.tenantId
                            };

                            tenantJournalAccount_A0001 = {
                                voucher_no : journal_account_item_B0001.voucher_no,
                                revenue_and_expenditure_type: 'A0001',
                                digest: elderly.name + ' ' + journal_account_item_B0001.digest,
                                amount: journal_account_item_B0001.amount,
                                source_type: app.modelVariables.SOURCE_TYPES.ELDERLY,
                                source_id: elderly._id,
                                source_key: '$journal_account.voucher_no',
                                tenantId: elderly.tenantId
                            };
                            //修改租户明细账
                            old_tenant_subsidiary_ledger = app.clone(tenant_json.subsidiary_ledger);
                            tenant.subsidiary_ledger.self += tenantJournalAccount_A0001.amount - tenantJournalAccount_B0006.amount;

                            yield elderly.save();
                            steps="A";

                            tenantJournalAccount_B0006 = yield app.modelFactory().model_create(app.models['pub_tenantJournalAccount'], tenantJournalAccount_B0006);
                            remove_tenantJournalAccount_B0006_id = tenantJournalAccount_B0006._id;
                            steps+="A";
                            tenantJournalAccount_A0001 = yield app.modelFactory().model_create(app.models['pub_tenantJournalAccount'], tenantJournalAccount_A0001);
                            remove_tenantJournalAccount_A0001_id = tenantJournalAccount_A0001._id;
                            steps+="A";

                            yield tenant.save();
                            steps+="A";

                            this.body = app.wrapper.res.default();
                        }
                        catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps){
                                for(var i=0;i<steps.length;i++) {
                                    switch (i) {
                                        case 0:
                                            elderly.charge_items = old_elderly_charge_items;
                                            elderly.journal_account = old_elderly_journal_account;
                                            elderly.subsidiary_ledger = old_elderly_subsidiary_ledger;
                                            elderly.charging_on_of_monthly_prepay = raw_elderly_charging_on_of_monthly_prepay;
                                            elderly.charge_item_change_history = old_elderly_charge_item_change_history;
                                            if(summary_key) {
                                                elderly[summary_key] = old_elderly_charge_item_catalog_summary;
                                            }
                                            yield elderly.save();
                                            break;
                                        case 1:
                                            yield app.modelFactory().model_delete(app.models['pub_tenantJournalAccount'], remove_tenantJournalAccount_B0006_id);
                                            break;
                                        case 2:
                                            yield app.modelFactory().model_delete(app.models['pub_tenantJournalAccount'], remove_tenantJournalAccount_A0001_id);
                                            break;
                                        case 3:
                                            tenant.subsidiary_ledger = old_tenant_subsidiary_ledger;
                                            tenant.save();
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
                method: 'changeElderlyChargeItemForOtherAndCustomized',
                verb: 'post',
                url: this.service_url_prefix + "/changeElderlyChargeItemForOtherAndCustomized",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var tenant,elderly;
                        var journal_account_item_A0003,journal_account_item_B0001,tenantJournalAccount_B0006,tenantJournalAccount_A0001;
                        var remove_elderly_charge_item_change_history_id,remove_tenantJournalAccount_B0006_id,remove_tenantJournalAccount_A0001_id;
                        var summary_key;
                        var raw_elderly_charge_items,raw_elderly_charging_on_of_monthly_prepay,old_elderly_charge_item_change_history,old_elderly_charge_items, old_elderly_journal_account,old_elderly_subsidiary_ledger,
                            old_elderly_charge_item_catalog_summary,old_tenant_subsidiary_ledger;
                        try {
                            var tenantId = this.request.body.tenantId;
                            var elderlyId = this.request.body.elderlyId;
                            var charge_item_catalog_id = this.request.body.charge_item_catalog_id;
                            var selectedOtherAndCustomized = this.request.body.selectedOtherAndCustomized;

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }
                            elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], elderlyId);
                            if(!elderly || elderly.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }

                            var tenant_json = tenant.toObject();
                            var elderly_json = elderly.toObject();
                            console.log('前置检查完成');

                            raw_elderly_charge_items = app.clone(elderly_json.charge_items);
                            raw_elderly_charging_on_of_monthly_prepay = app.clone(elderly_json.charging_on_of_monthly_prepay);
                            old_elderly_journal_account = app.clone(elderly_json.journal_account);
                            old_elderly_charge_item_change_history =  app.clone(elderly_json.charge_item_change_history);

                            var charge_item_catalog_id_of_cutomized = app.modelVariables['PENSION-AGENCY'].CHARGE_ITEM_CUSTOMIZED_CATAGORY._ID + '-' + elderly_json.charge_standard;
                            var charge_item_catalog_id_of_other = app.modelVariables['PENSION-AGENCY'].CHARGE_ITEM_OTHER_CATAGORY._ID + '-' + elderly_json.charge_standard;

                            var charge_itemsForOtherAndCustomized = app._.filter(elderly_json.charge_items,function(o) {
                                return app._.initial(o.item_id.split('.')).join('.') == charge_item_catalog_id_of_cutomized.toLowerCase() ||
                                    app._.initial(o.item_id.split('.')).join('.') == charge_item_catalog_id_of_other.toLowerCase();
                            });
                            var elderlyChargeItemIds = app._.pluck(charge_itemsForOtherAndCustomized,'item_id');
                            //先找出增加的项目和不变的项目并老人收费项目变动历史
                            for(var i=0;i<selectedOtherAndCustomized.length;i++){
                                var chargeItemOfTenant = app._.findWhere(tenant_json.charge_items,{item_id: selectedOtherAndCustomized[i]});

                                if(app._.contains(elderlyChargeItemIds,selectedOtherAndCustomized[i])){
                                    //检查个人账户和租户账户中收费项目的定价是否一致
                                    //如果不一至则需要将租户里的定价更新到老人中
                                    var chargeItemOfElderly = app._.findWhere(charge_itemsForOtherAndCustomized,{item_id:selectedOtherAndCustomized[i]});

                                    var chargeItemHistoryOfElderly = app._.findWhere(elderly_json.charge_item_change_history,{new_item_id:selectedOtherAndCustomized[i]});

                                    if(chargeItemOfTenant.period_price != chargeItemOfElderly.period_price){
                                        for(var i= 0;i< charge_itemsForOtherAndCustomized.length;i++){
                                            if(elderly.charge_items[i].item_id == chargeItemOfElderly.item_id){
                                                elderly.charge_items[i].item_name = chargeItemOfTenant.item_name;
                                                elderly.charge_items[i].period_price = chargeItemOfTenant.period_price;
                                                elderly.charge_items[i].period = chargeItemOfTenant.period;
                                            }
                                        }

                                        if(chargeItemHistoryOfElderly){
                                            //增加一条价格变化的数据
                                            elderly.charge_item_change_history.push({
                                                charge_item_catalog_id: chargeItemHistoryOfElderly.charge_item_catalog_id,
                                                old_item_id: chargeItemHistoryOfElderly.item_id,
                                                old_item_name: chargeItemHistoryOfElderly.item_name,
                                                old_period_price: chargeItemHistoryOfElderly.period_price,
                                                old_period: chargeItemHistoryOfElderly.period,
                                                new_item_id: chargeItemOfTenant.item_id,
                                                new_item_name: chargeItemOfTenant.item_name,
                                                new_period_price: chargeItemOfTenant.period_price,
                                                new_period: chargeItemOfTenant.period
                                            });
                                        }
                                        else{
                                            //增加一条初始记录
                                            elderly.charge_item_change_history.push({
                                                charge_item_catalog_id: (chargeItemOfTenant.item_id.indexOf(charge_item_catalog_id.toLowerCase()) != -1) ? charge_item_catalog_id_of_cutomized : charge_item_catalog_id,
                                                new_item_id: chargeItemOfTenant.item_id,
                                                new_item_name: chargeItemOfTenant.item_name,
                                                new_period_price: chargeItemOfTenant.period_price,
                                                new_period: chargeItemOfTenant.period
                                            });
                                        }
                                    }

                                }
                                else {

                                    elderly.charge_items.push(chargeItemOfTenant);

                                    elderly.charge_item_change_history.push({
                                        charge_item_catalog_id: (chargeItemOfTenant.item_id.indexOf(charge_item_catalog_id.toLowerCase()) != -1) ? charge_item_catalog_id_of_cutomized : charge_item_catalog_id,
                                        new_item_id: chargeItemOfTenant.item_id,
                                        new_item_name: chargeItemOfTenant.item_name,
                                        new_period_price: chargeItemOfTenant.period_price,
                                        new_period: chargeItemOfTenant.period
                                    });
                                }
                            }
                            //再找出删除的项目并老人收费项目变动历史
                            for(var i=0;i<elderlyChargeItemIds.length;i++) {
                                if (!app._.contains(selectedOtherAndCustomized, elderlyChargeItemIds[i])) {

                                    var indexToRemove = -1;
                                    for (var j = 0; j < elderly.charge_items.length; j++) {
                                        if (elderlyChargeItemIds[i] == elderly.charge_items[j].item_id) {
                                            indexToRemove = j;
                                            break;
                                        }
                                    }
                                    if (indexToRemove != -1) {
                                        var arr_removed = elderly.charge_items.splice(indexToRemove, 1);
                                        if(arr_removed.length>0){
                                            var charge_item_to_remove = arr_removed[0];
                                            elderly.charge_item_change_history.push({
                                                charge_item_catalog_id: (charge_item_to_remove.item_id.indexOf(charge_item_catalog_id.toLowerCase()) != -1) ? charge_item_catalog_id_of_cutomized : charge_item_catalog_id,
                                                old_item_id: charge_item_to_remove.item_id,
                                                old_item_name: charge_item_to_remove.item_name,
                                                old_period_price: charge_item_to_remove.period_price,
                                                old_period: charge_item_to_remove.period
                                            });
                                        }
                                    }
                                }
                            }

                            //计算退还预付月租
                            var firstPrepayDate = elderly.charging_on_of_monthly_prepay;
                            if(!firstPrepayDate) {
                                var arr_journal_account_B0001 = app._.where(elderly_json.journal_account, {revenue_and_expenditure_type: 'B0001'});
                                var latest_journal_account_B0001 = app._.max(arr_journal_account_B0001, function (item) {
                                    return item.check_in_time;
                                });
                                firstPrepayDate = latest_journal_account_B0001.check_in_time;
                            }
                            var daysOfMonthOnAverage = 30;
                            var raw_monthly_prepay_price = app._.reduce(app._.pluck(raw_elderly_charge_items, 'period_price'), function (total, period_price) {
                                return total + period_price;
                            }, 0);

                            var charge_item_day_price = raw_monthly_prepay_price / daysOfMonthOnAverage;
                            var remainder = daysOfMonthOnAverage - app.moment().diff(firstPrepayDate, 'days') % daysOfMonthOnAverage;
                            var refund = (charge_item_day_price * remainder);

                            //预付月租退款(按天计算)
                            journal_account_item_A0003 = {
                                voucher_no: yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.BOOKING_TO_TENANT,elderly_json.tenantId),
                                revenue_and_expenditure_type: 'A0003',
                                digest: app.moment().format('YYYY-MM-DD')+':其他及自定义收费项目变更而重新计费,并退回' + remainder + '天预收款',
                                amount: refund
                            };

                            var new_monthly_prepay_price = app._.reduce(app._.pluck(elderly.charge_items, 'period_price'), function (total, period_price) {
                                return total + period_price;
                            }, 0);

                            //变化后的预付月租
                            journal_account_item_B0001 = {
                                voucher_no: yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.BOOKING_TO_TENANT,elderly_json.tenantId),
                                revenue_and_expenditure_type: 'B0001',
                                digest: app.moment().format('YYYY-MM-DD') + ':其他及自定义收费项目变更而重新计费',
                                amount: new_monthly_prepay_price * 1
                            };

                            //记录老人流水账
                            elderly.journal_account.push(journal_account_item_A0003);
                            elderly.journal_account.push(journal_account_item_B0001);

                            //修改老人明细账
                            old_elderly_subsidiary_ledger = app.clone(elderly_json.subsidiary_ledger);
                            elderly.subsidiary_ledger.self += journal_account_item_A0003.amount - journal_account_item_B0001.amount;

                            //修改月租预付重新计费时间
                            elderly.charging_on_of_monthly_prepay = app.moment();

                            //记录租户流水账
                            tenantJournalAccount_B0006 = {
                                voucher_no : journal_account_item_A0003.voucher_no,
                                revenue_and_expenditure_type: 'B0006',
                                digest: elderly.name + ' ' + journal_account_item_A0003.digest,
                                amount: journal_account_item_A0003.amount,
                                source_type: app.modelVariables.SOURCE_TYPES.ELDERLY,
                                source_id: elderly._id,
                                source_key: '$journal_account.voucher_no',
                                tenantId: elderly.tenantId
                            };

                            tenantJournalAccount_A0001 = {
                                voucher_no : journal_account_item_B0001.voucher_no,
                                revenue_and_expenditure_type: 'A0001',
                                digest: elderly.name + ' ' + journal_account_item_B0001.digest,
                                amount: journal_account_item_B0001.amount,
                                source_type: app.modelVariables.SOURCE_TYPES.ELDERLY,
                                source_id: elderly._id,
                                source_key: '$journal_account.voucher_no',
                                tenantId: elderly.tenantId
                            };
                            //修改租户明细账
                            old_tenant_subsidiary_ledger = app.clone(tenant_json.subsidiary_ledger);
                            tenant.subsidiary_ledger.self += tenantJournalAccount_A0001.amount - tenantJournalAccount_B0006.amount;

                            yield elderly.save();
                            steps="A";

                            tenantJournalAccount_B0006 = yield app.modelFactory().model_create(app.models['pub_tenantJournalAccount'], tenantJournalAccount_B0006);
                            remove_tenantJournalAccount_B0006_id = tenantJournalAccount_B0006._id;
                            steps+="A";
                            tenantJournalAccount_A0001 = yield app.modelFactory().model_create(app.models['pub_tenantJournalAccount'], tenantJournalAccount_A0001);
                            remove_tenantJournalAccount_A0001_id = tenantJournalAccount_A0001._id;
                            steps+="A";

                            yield tenant.save();
                            steps+="A";

                            this.body = app.wrapper.res.default();
                        }
                        catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps){
                                for(var i=0;i<steps.length;i++) {
                                    switch (i) {
                                        case 0:
                                            elderly.charge_items = old_elderly_charge_items;
                                            elderly.journal_account = old_elderly_journal_account;
                                            elderly.subsidiary_ledger = old_elderly_subsidiary_ledger;
                                            elderly.charging_on_of_monthly_prepay = raw_elderly_charging_on_of_monthly_prepay;
                                            elderly.charge_item_change_history = old_elderly_charge_item_change_history;
                                            yield elderly.save();
                                            break;
                                        case 1:
                                            yield app.modelFactory().model_delete(app.models['pub_tenantJournalAccount'], remove_tenantJournalAccount_B0006_id);
                                            break;
                                        case 2:
                                            yield app.modelFactory().model_delete(app.models['pub_tenantJournalAccount'], remove_tenantJournalAccount_A0001_id);
                                            break;
                                        case 3:
                                            tenant.subsidiary_ledger = old_tenant_subsidiary_ledger;
                                            tenant.save();
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
                method: 'changeElderlyNursingLevel',
                verb: 'post',
                url: this.service_url_prefix + "/changeElderlyNursingLevel", //直接修改老人护理级别
                handler: function (app, options) {
                    return function * (next) {
                        var tenant, elderly, nursingLevel, nursingPlan;
                        try {
                            var tenantId = this.request.body.tenantId;
                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }
                            var elderlyId = this.request.body.elderlyId;
                            elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], elderlyId);
                            if(!elderly || elderly.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                yield next;
                                return;
                            }
                            var nursingLevelId = this.request.body.nursingLevelId;
                            nursingLevel = yield app.modelFactory().model_read(app.models['psn_nursingLevel'], nursingLevelId);
                            if(!nursingLevel || nursingLevel.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到护理级别!'});
                                yield next;
                                return;
                            }

                            console.log('nursingLevelId:', nursingLevelId);
                            if (nursingLevelId === (elderly.nursingLevelId || '').toString()) {
                                this.body = app.wrapper.res.error({message: '护理级别没有变化!'});
                                yield next;
                                return;
                            }

                            var oldNursingLevelId = elderly.nursingLevelId;

                            var operated_by = this.request.body.operated_by;
                            var operated_by_name = this.request.body.operated_by_name;

                            elderly.nursingLevelId = nursingLevelId;
                            yield elderly.save();

                            yield app.modelFactory().model_create(app.models['psn_elderlySpecificSpotChangeLog'],{
                                operated_by: operated_by,
                                operated_by_name: operated_by_name,
                                elderlyId: elderlyId,
                                elderly_name: elderly.name,
                                col_name: 'nursingLevelId',
                                col_val_old: oldNursingLevelId || 'null',
                                col_val_new: nursingLevelId,
                                fromMethod: 'changeElderlyNursingLevel',
                                tenantId: elderly.tenantId
                            });

                            // 如果更换护理等级,将清空对应的所有工作项目
                            var elderlyNursingPlan = yield app.modelFactory().model_one(app.models['psn_nursingPlan'],{
                                select: 'work_items',
                                where: {
                                    status: 1,
                                    elderlyId: elderlyId,
                                    tenantId: tenantId
                                }
                            });
                            elderlyNursingPlan.work_items = [];
                            yield elderlyNursingPlan.save();

                            this.body = app.wrapper.res.ret({oldNursingLevelId: oldNursingLevelId, nursingLevelId: nursingLevelId,nursingLevelName: nursingLevel.name});
                        }
                        catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            /**********************老人充值记账相关*****************************/
            {
                method: 'bookingRecharge',
                verb: 'post',
                url: this.service_url_prefix + "/bookingRecharge/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var recharge,elderly, tenant;
                        var raw_recharge_operated_by,raw_recharge_operated_by_name;
                        var raw_elderly_subsidiary_ledger, raw_elderly_journal_account;
                        var new_elderly_journal_account_item_A0001;
                        try {
                            var operated_by = this.request.body.operated_by;
                            var operated_by_name = this.request.body.operated_by_name;
                            if (!operated_by) {
                                this.body = app.wrapper.res.error({message: '缺少操作人数据!'});
                                yield next;
                                return;
                            }

                            recharge = yield app.modelFactory().model_read(app.models['psn_recharge'], this.params._id);
                            if (!recharge || recharge.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到充值记录!'});
                                yield next;
                                return;
                            }
                            if (recharge.voucher_no) {
                                this.body = app.wrapper.res.error({message: '充值记录已经入账无需重新记账!'});
                                yield next;
                                return;
                            }

                            elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], recharge.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }

                            if (!elderly.live_in_flag || elderly.begin_exit_flow) {
                                this.body = app.wrapper.res.error({message: '当前老人不在院或正在办理出院手续，无法记账!'});
                                yield next;
                                return;
                            }

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], recharge.tenantId);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }

                            var recharge_json = recharge.toObject();
                            var elderly_json = elderly.toObject();
                            console.log('前置检查完成');

                            raw_recharge_operated_by = recharge_json.operated_by;
                            raw_recharge_operated_by_name = recharge_json.operated_by_name;
                            //raw_elderly_subsidiary_ledger = app.clone(elderly_json.subsidiary_ledger);
                            //raw_elderly_journal_account = app.clone(elderly_json.journal_account);

                            recharge.operated_by = operated_by;
                            recharge.operated_by_name = operated_by_name;


                            new_elderly_journal_account_item_A0001 = {
                                voucher_no: yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.BOOKING_TO_TENANT,elderly_json.tenantId),
                                revenue_and_expenditure_type: 'A0001',
                                digest: app.moment(recharge_json.check_in_time).format('YYYY-MM-DD') + ':' + app.dictionary.pairs["D3005"][recharge_json.type].name,
                                amount: recharge_json.amount
                            };
                            recharge.voucher_no = new_elderly_journal_account_item_A0001.voucher_no;

                            elderly.journal_account.push(new_elderly_journal_account_item_A0001);

                            //更新老人分类账
                            elderly.subsidiary_ledger.self += new_elderly_journal_account_item_A0001.amount;

                            ////现金业务不应该更新租户账户
                            ////记录租户流水账
                            //new_tenantJournalAccount_A0001 = {
                            //    voucher_no : yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.BOOKING_TO_TENANT,elderly_json.tenantId),
                            //    revenue_and_expenditure_type: 'A0001',
                            //    digest: elderly.name + ' ' + new_elderly_journal_account_item_A0001.digest,
                            //    amount: new_elderly_journal_account_item_A0001.amount,
                            //    tenantId: elderly.tenantId
                            //};
                            ////更新租户分类账
                            //tenant.subsidiary_ledger.self += new_tenantJournalAccount_A0001.amount;

                            yield recharge.save();
                            steps = 'A';
                            yield elderly.save();
                            //steps += 'A';
                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps) {
                                for (var i = 0; i < steps.length; i++) {
                                    switch (i) {
                                        case 0:
                                            recharge.operated_by = raw_recharge_operated_by;
                                            recharge.operated_by_name = raw_recharge_operated_by_name;
                                            yield recharge.save();
                                            break;
                                        //case 1:
                                        //    elderly.subsidiary_ledger = raw_elderly_subsidiary_ledger;
                                        //    elderly.journal_account = raw_elderly_journal_account;
                                        //    yield elderly.save();
                                        //    break;
                                    }
                                }
                            }
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'checkCanChangeBookingOrUnbookingRecharge',//检测是否能够记账或撤销记账
                verb: 'get',
                url: this.service_url_prefix + "/checkCanChangeBookingOrUnbookingRecharge/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var recharge, elderly, tenant;

                        try {

                            recharge = yield app.modelFactory().model_read(app.models['psn_recharge'], this.params._id);
                            if (!recharge || recharge.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到充值记录!'});
                                yield next;
                                return;
                            }
                            if (!recharge.voucher_no) {
                                this.body = app.wrapper.res.ret({itCan: false});
                                yield next;
                                return;
                            }

                            elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], recharge.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                yield next;
                                return;
                            }
                            if (!elderly.live_in_flag || elderly.begin_exit_flow) {
                                this.body = app.wrapper.res.error({itCan: false, message: '当前老人不在院或正在办理出院手续，无法记账!'});
                                yield next;
                                return;
                            }

                            var recharge_json = recharge.toObject();
                            var elderly_json = elderly.toObject();
                            console.log('前置检查完成');

                            var bookingJournalAccountItem = app._.findWhere(elderly_json.journal_account, {voucher_no: recharge_json.voucher_no,carry_over_flag:false});

                            this.body = app.wrapper.res.ret({itCan: bookingJournalAccountItem != null});
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                        }
                        yield next;
                    };
                }
            },
            {
                method: 'disableRechargeAndUnbooking', //作废充值记录并撤销记账
                verb: 'post',
                url: this.service_url_prefix + "/disableRechargeAndUnbooking/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var recharge,elderly, tenant;
                        var raw_recharge_status,raw_recharge_operated_by,raw_recharge_operated_by_name;
                        var raw_elderly_subsidiary_ledger, raw_elderly_journal_account;
                        try {
                            var operated_by = this.request.body.operated_by;
                            var operated_by_name = this.request.body.operated_by_name;
                            if (!operated_by) {
                                this.body = app.wrapper.res.error({message: '缺少操作人数据!'});
                                yield next;
                                return;
                            }

                            recharge = yield app.modelFactory().model_read(app.models['psn_recharge'], this.params._id);
                            if (!recharge || recharge.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到充值记录!'});
                                yield next;
                                return;
                            }
                            if (!recharge.voucher_no) {
                                this.body = app.wrapper.res.error({message: '充值记录还未记账，无需撤销!'});
                                yield next;
                                return;
                            }

                            elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], recharge.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                yield next;
                                return;
                            }

                            if (!elderly.live_in_flag || elderly.begin_exit_flow) {
                                this.body = app.wrapper.res.error({message: '当前老人不在院或正在办理出院手续，无法记账!'});
                                yield next;
                                return;
                            }

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], recharge.tenantId);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }

                            var recharge_json = recharge.toObject();
                            var elderly_json = elderly.toObject();
                            console.log('前置检查完成');

                            raw_recharge_status = recharge_json.status;
                            raw_recharge_operated_by = recharge_json.operated_by;
                            raw_recharge_operated_by_name = recharge_json.operated_by_name;
                            //raw_elderly_subsidiary_ledger = app.clone(elderly_json.subsidiary_ledger);
                            //raw_elderly_journal_account = app.clone(elderly_json.journal_account);

                            recharge.status = 0;
                            recharge.operated_by = operated_by;
                            recharge.operated_by_name = operated_by_name;

                            var isBookingJournalAccountItemCarryOver = false;
                            var unbookingAmount = 0;
                            var arr_journal_account = elderly.journal_account;
                            for(var i=0;i<arr_journal_account.length;i++) {
                                //此处已经确定是充值，所以不用管是收入还是支出，其必定是收入
                                if (arr_journal_account[i].voucher_no == recharge_json.voucher_no) {
                                    if(arr_journal_account[i].carry_over_flag == false){
                                        unbookingAmount = arr_journal_account[i].amount;
                                    }
                                    else{
                                        isBookingJournalAccountItemCarryOver = true;
                                    }
                                }
                            }

                            if(isBookingJournalAccountItemCarryOver){
                                this.body = app.wrapper.res.error({message: '充值记录记账凭证已经结算，无需撤销!'});
                                yield next;
                                return;
                            }


                            elderly.journal_account = app._.reject(elderly_json.journal_account,{voucher_no : recharge_json.voucher_no});

                            //更新老人分类账
                            elderly.subsidiary_ledger.self -= unbookingAmount;


                            yield recharge.save();
                            steps = 'A';
                            yield elderly.save();
                            //steps += 'A';
                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps) {
                                for (var i = 0; i < steps.length; i++) {
                                    switch (i) {
                                        case 0:
                                            recharge.status = raw_recharge_status;
                                            recharge.operated_by = raw_recharge_operated_by;
                                            recharge.operated_by_name = raw_recharge_operated_by_name;
                                            yield recharge.save();
                                            break;
                                        //case 1:
                                        //    elderly.subsidiary_ledger = raw_elderly_subsidiary_ledger;
                                        //    elderly.journal_account = raw_elderly_journal_account;
                                        //    yield elderly.save();
                                        //    break;
                                    }
                                }
                            }
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'changeRechargeBookingAmount',//修改充值记账的数额
                verb: 'post',
                url: this.service_url_prefix + "/changeRechargeBookingAmount/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var recharge,elderly, tenant;
                        var raw_recharge_operated_by,raw_recharge_operated_by_name;
                        var raw_elderly_subsidiary_ledger, raw_elderly_journal_account;

                        try {
                            var operated_by = this.request.body.operated_by;
                            var operated_by_name = this.request.body.operated_by_name;
                            if (!operated_by) {
                                this.body = app.wrapper.res.error({message: '缺少操作人数据!'});
                                yield next;
                                return;
                            }

                            recharge = yield app.modelFactory().model_read(app.models['psn_recharge'], this.params._id);
                            if (!recharge || recharge.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到充值记录!'});
                                yield next;
                                return;
                            }
                            if (!recharge.voucher_no) {
                                this.body = app.wrapper.res.error({message: '充值记录还未记账，无需撤销!'});
                                yield next;
                                return;
                            }

                            elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], recharge.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                yield next;
                                return;
                            }

                            if (!elderly.live_in_flag || elderly.begin_exit_flow) {
                                this.body = app.wrapper.res.error({message: '当前老人不在院或正在办理出院手续，无法记账!'});
                                yield next;
                                return;
                            }

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], recharge.tenantId);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }

                            var recharge_json = recharge.toObject();
                            console.log('前置检查完成');

                            raw_recharge_operated_by = recharge_json.operated_by;
                            raw_recharge_operated_by_name = recharge_json.operated_by_name;

                            recharge.operated_by = operated_by;
                            recharge.operated_by_name = operated_by_name;

                            var isBookingJournalAccountItemCarryOver = false;
                            var newBookingAmount =  recharge_json.amount;
                            var oldBookingAmount = 0;
                            var arr_journal_account = elderly.journal_account;
                            for(var i=0;i<arr_journal_account.length;i++) {
                                //此处已经确定是充值，所以不用管是收入还是支出，其必定是收入
                                if (arr_journal_account[i].voucher_no == recharge_json.voucher_no) {
                                    if(arr_journal_account[i].carry_over_flag == false){
                                        oldBookingAmount = arr_journal_account[i].amount;
                                        arr_journal_account[i].amount = newBookingAmount;
                                    }
                                    else{
                                        isBookingJournalAccountItemCarryOver = true;
                                    }
                                }
                            }

                            if(isBookingJournalAccountItemCarryOver){
                                this.body = app.wrapper.res.error({message: '充值记录记账凭证已经结算，无需撤销!'});
                                yield next;
                                return;
                            }

                            //更新老人分类账
                            elderly.subsidiary_ledger.self = elderly.subsidiary_ledger.self - oldBookingAmount + newBookingAmount;


                            yield recharge.save();
                            steps = 'A';
                            yield elderly.save();
                            //steps += 'A';
                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps) {
                                for (var i = 0; i < steps.length; i++) {
                                    switch (i) {
                                        case 0:
                                            recharge.status = raw_recharge_status;
                                            recharge.operated_by = raw_recharge_operated_by;
                                            recharge.operated_by_name = raw_recharge_operated_by_name;
                                            yield recharge.save();
                                            break;
                                        //case 1:
                                        //    elderly.subsidiary_ledger = raw_elderly_subsidiary_ledger;
                                        //    elderly.journal_account = raw_elderly_journal_account;
                                        //    yield elderly.save();
                                        //    break;
                                    }
                                }
                            }
                        }
                        yield next;
                    };
                }
            },
            /**********************老人充值记账后的冲红相关*****************************/
            {
                method: 'checkCanBookingRedToElderlyRecharge',//检查是否是系统内部记账，如果是则需要在前台做好提醒不需要冲红，但不强制禁止冲红
                verb: 'post',
                url: this.service_url_prefix + "/checkCanBookingRedToElderlyRecharge",
                handler: function (app, options) {
                    return function * (next) {
                        var recharge_to_red,tenantJournalAccount_to_red, elderly,tenant;
                        try {
                            var tenantId = this.request.body.tenantId;
                            var voucher_no_to_red = this.request.body.voucher_no_to_red;

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }
                            console.log('前置检查完成');

                            recharge_to_red = yield app.modelFactory().model_one(app.models['psn_recharge'], {
                                where: {
                                    status: 1,
                                    voucher_no: voucher_no_to_red,
                                    tenantId: tenantId
                                }
                            });

                            tenantJournalAccount_to_red = yield app.modelFactory().model_one(app.models['pub_tenantJournalAccount'], {
                                where: {
                                    status: 1,
                                    voucher_no: voucher_no_to_red,
                                    tenantId: tenantId
                                }
                            });

                            console.log(voucher_no_to_red);

                            var can_not_find_recharge_to_red = !recharge_to_red || recharge_to_red.status == 0;
                            var can_not_find_tenantJournalAccount_to_red = !tenantJournalAccount_to_red || tenantJournalAccount_to_red.status == 0;

                            if (can_not_find_recharge_to_red && can_not_find_tenantJournalAccount_to_red) {

                                this.body = app.wrapper.res.error({message: '无法找到需要冲红的流水记录!'});
                                yield next;
                                return;
                            }

                            if(!can_not_find_recharge_to_red){
                                elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], recharge_to_red.elderlyId);
                                if (!elderly || elderly.status == 0) {
                                    this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                    yield next;
                                    return;
                                }

                                if (!elderly.live_in_flag || elderly.begin_exit_flow) {
                                    this.body = app.wrapper.res.error({message: '当前老人不在院或正在办理出院手续，无法冲红!'});
                                    yield next;
                                    return;
                                }

                                var journal_account = elderly.journal_account;
                                for(var i=0;i<journal_account.length;i++){
                                    if(journal_account[i].voucher_no == voucher_no_to_red && !journal_account[i].carry_over_flag)
                                    {
                                        this.body = app.wrapper.res.error({message: '当前充值流水没有结转，无法冲红，可以修改或删除!'});
                                        yield next;
                                        return;
                                    }
                                }
                            }

                            if(!can_not_find_tenantJournalAccount_to_red){
                                if(!tenantJournalAccount_to_red.carry_over_flag){
                                    this.body = app.wrapper.res.error({message: '当前流水没有结转，无法冲红，可以修改或删除!'});
                                    yield next;
                                    return;
                                }
                            }


                            this.body = app.wrapper.res.ret({itCan: true, isSystemInnerBooking: !can_not_find_tenantJournalAccount_to_red});
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                        }
                        yield next;
                    };
                }
            },
            {
                method: 'bookingRedToElderlyRecharge',
                verb: 'post',
                url: this.service_url_prefix + "/bookingRedToElderlyRecharge",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var recharge_to_red,tenantJournalAccount_to_red,red,elderly, tenant;
                        var raw_red_operated_by,raw_red_operated_by_name;
                        var raw_elderly_subsidiary_ledger, raw_elderly_journal_account,raw_tenant_subsidiary_ledger;
                        var new_elderly_journal_account_item_B0003,new_tenantJournalAccount_B0008;
                        var remove_tenantJournalAccount_B0008_id;
                        try {
                            var voucher_no_to_red = this.request.body.voucher_no_to_red;
                            var operated_by = this.request.body.operated_by;
                            var operated_by_name = this.request.body.operated_by_name;
                            var tenantId = this.request.body.tenantId;
                            var isSystemInnerBooking = this.request.body.isSystemInnerBooking;
                            var amount = this.request.body.amount;

                            var voucher_no,remark;

                            if (!operated_by) {
                                this.body = app.wrapper.res.error({message: '缺少操作人数据!'});
                                yield next;
                                return;
                            }

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }


                            if(!isSystemInnerBooking) {
                                //老人充值流水
                                recharge_to_red = yield app.modelFactory().model_one(app.models['psn_recharge'], {
                                    where: {
                                        status: 1,
                                        voucher_no: voucher_no_to_red,
                                        tenantId: tenantId
                                    }
                                });
                                if (!recharge_to_red || recharge_to_red.status == 0) {
                                    this.body = app.wrapper.res.error({message: '无法找到需要冲红的流水记录!'});
                                    yield next;
                                    return;
                                }

                                elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], recharge_to_red.elderlyId);
                                if (!elderly || elderly.status == 0) {
                                    this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                    yield next;
                                    return;
                                }

                                if (!elderly.live_in_flag || elderly.begin_exit_flow) {
                                    this.body = app.wrapper.res.error({message: '当前老人不在院或正在办理出院手续，无法记账!'});
                                    yield next;
                                    return;
                                }

                                var journal_account = elderly.journal_account;
                                for (var i = 0; i < journal_account.length; i++) {
                                    if (journal_account[i].voucher_no == voucher_no_to_red && !journal_account[i].carry_over_flag) {
                                        this.body = app.wrapper.res.error({message: '当前充值流水没有结转，无法冲红，可以修改或删除!'});
                                        yield next;
                                        return;
                                    }
                                }

                                console.log('前置检查完成');


                                var elderly_json = elderly.toObject();
                                raw_elderly_subsidiary_ledger = app.clone(elderly_json.subsidiary_ledger);
                                raw_elderly_journal_account = app.clone(elderly_json.journal_account);

                                remark = elderly_json.name + '老人充值流水';
                                voucher_no = yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.BOOKING_TO_TENANT, tenantId);
                                //老人充值冲红记账
                                new_elderly_journal_account_item_B0003 = {
                                    voucher_no: voucher_no,
                                    revenue_and_expenditure_type: 'B0003',
                                    digest: voucher_no_to_red,
                                    amount: amount,
                                    red_flag: true
                                };

                                elderly.journal_account.push(new_elderly_journal_account_item_B0003);
                                //冲红是支出+=
                                elderly.subsidiary_ledger.self += (new_elderly_journal_account_item_B0003.revenue_and_expenditure_type.substr(0, 1) == 'B' ? -1 : 1) * new_elderly_journal_account_item_B0003.amount;

                                yield elderly.save();
                                steps = 'A';
                            }
                            else{
                                //系统内部流水
                                tenantJournalAccount_to_red = yield app.modelFactory().model_one(app.models['pub_tenantJournalAccount'], {
                                    where: {
                                        status: 1,
                                        voucher_no: voucher_no_to_red,
                                        tenantId: tenantId
                                    }
                                });
                                if (!tenantJournalAccount_to_red || tenantJournalAccount_to_red.status == 0) {
                                    this.body = app.wrapper.res.error({message: '无法找到需要冲红的流水记录!'});
                                    yield next;
                                    return;
                                }

                                if(!tenantJournalAccount_to_red.carry_over_flag){
                                    this.body = app.wrapper.res.error({message: '当前流水没有结转，无法冲红，可以修改或删除!'});
                                    yield next;
                                    return;
                                }

                                if(tenantJournalAccount_to_red.source_type == app.modelVariables.SOURCE_TYPES.ELDERLY){
                                    elderly = yield app.modelFactory().model_read(app.models['pub_elderly'], tenantJournalAccount_to_red.source_id);
                                    if (!elderly || elderly.status == 0) {
                                        this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                        yield next;
                                        return;
                                    }
                                    // source_key ='$journal_account.voucher_no';
                                    if (!elderly.live_in_flag || elderly.begin_exit_flow) {
                                        this.body = app.wrapper.res.error({message: '当前老人不在院或正在办理出院手续，无法冲红!'});
                                        yield next;
                                        return;
                                    }
                                }
                                else{
                                    this.body = app.wrapper.res.error({message: '当前流水没有记录来源，无法冲红!'});
                                    yield next;
                                    return;
                                }

                                console.log('前置检查完成');

                                var tenant_json = tenant.toObject();
                                raw_tenant_subsidiary_ledger = app.clone(tenant_json.subsidiary_ledger);

                                remark='系统内部流水';
                                voucher_no = yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.BOOKING_TO_TENANT,tenantId);

                                if(elderly){
                                    //系统内部流水追溯到老人
                                    var elderly_json = elderly.toObject();
                                    raw_elderly_subsidiary_ledger = app.clone(elderly_json.subsidiary_ledger);
                                    raw_elderly_journal_account = app.clone(elderly_json.journal_account);

                                    new_elderly_journal_account_item_B0003 = {
                                        voucher_no: voucher_no,
                                        revenue_and_expenditure_type: 'B0003',
                                        digest: voucher_no_to_red,
                                        amount: amount,
                                        red_flag: true
                                    };

                                    elderly.journal_account.push(new_elderly_journal_account_item_B0003);
                                    //冲红是支出+=
                                    elderly.subsidiary_ledger.self += (new_elderly_journal_account_item_B0003.revenue_and_expenditure_type.substr(0, 1) == 'B' ? -1 : 1) * new_elderly_journal_account_item_B0003.amount;

                                    yield elderly.save();
                                    steps = 'A';
                                }
                                else{
                                    steps = 'Z';
                                }

                                new_tenantJournalAccount_B0008 = {
                                    voucher_no: voucher_no,
                                    revenue_and_expenditure_type: 'B0008',
                                    digest: voucher_no_to_red,
                                    amount: amount,
                                    red_flag: true,
                                    tenantId: tenant._id,
                                    source_type: app.modelVariables.SOURCE_TYPES.ELDERLY,
                                    source_id: elderly._id,
                                    source_key: '$journal_account.voucher_no'
                                };

                                //更新租户分类账,冲红是支出+=
                                tenant.subsidiary_ledger.self +=  (new_tenantJournalAccount_B0008.revenue_and_expenditure_type.substr(0, 1) == 'B' ? -1 : 1) * new_tenantJournalAccount_B0008.amount;


                                yield tenant.save();
                                steps += 'B';

                                new_tenantJournalAccount_B0008 = yield app.modelFactory().model_create(app.models['pub_tenantJournalAccount'], new_tenantJournalAccount_B0008);
                                remove_tenantJournalAccount_B0008_id = new_tenantJournalAccount_B0008._id;
                                steps += 'B';


                            }

                            red = yield app.modelFactory().model_create(app.models['pub_red'], {
                                operated_by: operated_by,
                                operated_by_name: operated_by_name,
                                amount: amount,
                                voucher_no_to_red: voucher_no_to_red,
                                voucher_no: voucher_no,
                                remark: remark,
                                tenantId: tenant._id
                            });
                            red = yield app.modelFactory().model_create(app.models['pub_red'], red);

                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps) {
                                for (var i = 0; i < steps.length; i++) {
                                    switch (i) {
                                        case 0:
                                            if (steps[i] == 'A') {
                                                elderly.journal_account = raw_elderly_journal_account;
                                                elderly.subsidiary_ledger = raw_elderly_subsidiary_ledger;
                                                yield elderly.save();
                                            }
                                            break;
                                        case 1:
                                            if (steps[i] == 'B') {
                                                tenant.subsidiary_ledger = raw_tenant_subsidiary_ledger;
                                                yield tenant.save();
                                            }
                                            break;
                                        case 2:
                                            if (steps[i] == 'B') {
                                                yield app.modelFactory().model_delete(app.models['pub_tenantJournalAccount'], remove_tenantJournalAccount_B0008_id)
                                            }
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
                method: 'checkCanChangeBookingOrUnbookingRedToElderlyRecharge',//检测是否能够修改或撤销冲红记录
                verb: 'get',
                url: this.service_url_prefix + "/checkCanChangeBookingOrUnbookingRedToElderlyRecharge/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var red, recharge_to_red,tenantJournalAccount_to_red,elderly, tenant;

                        try {
                            var itCan = true;

                            red = yield app.modelFactory().model_read(app.models['pub_red'], this.params._id);
                            if (!red || red.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到冲红记录!'});
                                yield next;
                                return;
                            }

                            recharge_to_red = yield app.modelFactory().model_one(app.models['psn_recharge'], {
                                where: {
                                    status: 1,
                                    voucher_no: red.voucher_no_to_red,
                                    tenantId: red.tenantId
                                }
                            });

                            var elderlyId;

                            recharge_to_red && (elderlyId = recharge_to_red.elderlyId);


                            if(!elderlyId){
                                //冲红的是系统内部流水
                                console.log('前置检查完成');
                                tenantJournalAccount_to_red = yield app.modelFactory().model_one(app.models['pub_tenantJournalAccount'], {
                                    where: {
                                        status: 1,
                                        voucher_no: red.voucher_no,
                                        carry_over_flag: false,
                                        tenantId: red.tenantId
                                    }
                                });

                                itCan = tenantJournalAccount_to_red != null;
                            }
                            else{
                                //冲红的是充值记录，则通过其找到目标老人
                                elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], elderlyId);
                                if (!elderly || elderly.status == 0) {
                                    this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                    yield next;
                                    return;
                                }
                                if (!elderly.live_in_flag || elderly.begin_exit_flow) {
                                    this.body = app.wrapper.res.error({itCan: false, message: '当前老人不在院或正在办理出院手续，无法记账!'});
                                    yield next;
                                    return;
                                }

                                console.log('前置检查完成');

                                var elderly_json = elderly.toObject();

                                var bookingJournalAccountItem = app._.findWhere(elderly_json.journal_account, {voucher_no: red.voucher_no,carry_over_flag:false});

                                itCan = bookingJournalAccountItem != null;
                            }

                            this.body = app.wrapper.res.ret({itCan: itCan});
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                        }
                        yield next;
                    };
                }
            },
            {
                method: 'disableRedAndUnbookingToElderlyRecharge',
                verb: 'post',
                url: this.service_url_prefix + "/disableRedAndUnbookingToElderlyRecharge/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var red,recharge_to_red,tenantJournalAccount_to_red,elderly, tenant;
                        var raw_red_status,raw_red_operated_by,raw_red_operated_by_name,raw_elderly_subsidiary_ledger, raw_elderly_journal_account,raw_tenantJournalAccountStatus,raw_tenant_subsidiary_ledger;
                        try {
                            var operated_by = this.request.body.operated_by;
                            var operated_by_name = this.request.body.operated_by_name;
                            if (!operated_by) {
                                this.body = app.wrapper.res.error({message: '缺少操作人数据!'});
                                yield next;
                                return;
                            }


                            red = yield app.modelFactory().model_read(app.models['pub_red'], this.params._id);
                            if (!red || red.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到充红记录!'});
                                yield next;
                                return;
                            }

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], red.tenantId);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }

                            recharge_to_red = yield app.modelFactory().model_one(app.models['psn_recharge'], {
                                where: {
                                    status: 1,
                                    voucher_no: red.voucher_no_to_red,
                                    tenantId: red.tenantId
                                }
                            });

                            var elderlyId;
                            recharge_to_red && recharge_to_red.status == 1 && (elderlyId = recharge_to_red.elderlyId);

                            if(!elderlyId){
                                //撤销冲红的是系统内部流水
                                tenantJournalAccount_to_red = yield app.modelFactory().model_one(app.models['pub_tenantJournalAccount'], {
                                    where: {
                                        status: 1,
                                        voucher_no: red.voucher_no,
                                        tenantId: red.tenantId,
                                        red_flag: true
                                    }
                                });

                                if(!tenantJournalAccount_to_red){
                                    this.body = app.wrapper.res.error({message: '无法找到需要撤销的流水记录!'});
                                    yield next;
                                    return;
                                }
                                else if(tenantJournalAccount_to_red.carry_over_flag){
                                    this.body = app.wrapper.res.error({message: '当前流水记录已经结转!'});
                                    yield next;
                                    return;
                                }

                                var index = -1, elderly_json, amountOfElderlyJournalAccount;
                                //通过source_type,source_id找到对应的老人冲红流水删除
                                if(tenantJournalAccount_to_red.source_type == app.modelVariables.SOURCE_TYPES.ELDERLY){
                                    elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], tenantJournalAccount_to_red.source_id);
                                    if (!elderly || elderly.status == 0) {
                                        this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                        yield next;
                                        return;
                                    }
                                    if (!elderly.live_in_flag || elderly.begin_exit_flow) {
                                        this.body = app.wrapper.res.error({message: '当前老人不在院或正在办理出院手续，无法撤销冲红!'});
                                        yield next;
                                        return;
                                    }

                                    elderly_json = elderly.toObject();
                                    raw_elderly_subsidiary_ledger = app.clone(elderly_json.subsidiary_ledger);
                                    raw_elderly_journal_account = app.clone(elderly_json.journal_account);

                                    index = -1;
                                    for(var i= 0;i<elderly.journal_account.length;i++) {
                                        if (elderly.journal_account[i].voucher_no == red.voucher_no && elderly.journal_account[i].red_flag) {
                                            index = i;
                                            break;
                                        }
                                    }

                                    if(index == -1){
                                        this.body = app.wrapper.res.error({message: '无法找到需要撤销的老人流水记录!'});
                                        yield next;
                                        return;
                                    }

                                    if(elderly.journal_account[index].carry_over_flag){
                                        this.body = app.wrapper.res.error({message: '当前流水记录已经结转!'});
                                        yield next;
                                        return;
                                    }

                                    amountOfElderlyJournalAccount = (elderly.journal_account[index].revenue_and_expenditure_type.substr(0, 1) == 'B' ? -1 : 1) *  elderly.journal_account[index].amount;

                                    console.log('前置检查完成');
                                    console.log(elderly.journal_account.length);
                                    elderly.journal_account.splice(index,1);
                                    console.log(elderly.journal_account.length);
                                    //冲红是支出，并且是撤销-=
                                    elderly.subsidiary_ledger.self -= amountOfElderlyJournalAccount;

                                    yield elderly.save();
                                    steps = 'A';
                                }
                                else{
                                    this.body = app.wrapper.res.error({message: '当前流水没有记录来源，无法撤销冲红!'});
                                    yield next;
                                    return;
                                }

                                var tenant_json = tenant.toObject();
                                raw_tenant_subsidiary_ledger = app.clone(tenant_json.subsidiary_ledger);
                                raw_tenantJournalAccountStatus = tenantJournalAccount_to_red.status;

                                //更新租户分类账,撤销冲红-=
                                tenant.subsidiary_ledger.self -=  (tenantJournalAccount_to_red.revenue_and_expenditure_type.substr(0, 1) == 'B' ? -1 : 1) * tenantJournalAccount_to_red.amount;
                                yield tenant.save();
                                steps += 'A';

                                tenantJournalAccount_to_red.status = 0;
                                yield tenantJournalAccount_to_red.save();
                                steps += 'A';

                            }
                            else{
                                //撤销冲红的是充值记录，则通过其找到目标老人

                                elderly = yield app.modelFactory().model_read(app.models['pub_elderly'], recharge_to_red.elderlyId);
                                if (!elderly || elderly.status == 0) {
                                    this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                    yield next;
                                    return;
                                }

                                if (!elderly.live_in_flag || elderly.begin_exit_flow) {
                                    this.body = app.wrapper.res.error({message: '当前老人不在院或正在办理出院手续，无法记账!'});
                                    yield next;
                                    return;
                                }

                                elderly_json = elderly.toObject();
                                raw_elderly_subsidiary_ledger = app.clone(elderly_json.subsidiary_ledger);
                                raw_elderly_journal_account = app.clone(elderly_json.journal_account);

                                index = -1;
                                console.log('red.voucher_no:'+red.voucher_no);
                                for(var i= 0;i<elderly.journal_account.length;i++) {

                                    if (elderly.journal_account[i].voucher_no == red.voucher_no && elderly.journal_account[i].red_flag) {
                                        index = i;
                                        break;
                                    }
                                }

                                if(index == -1){
                                    this.body = app.wrapper.res.error({message: '无法找到需要撤销的老人流水记录!'});
                                    yield next;
                                    return;
                                }

                                if(elderly.journal_account[index].carry_over_flag){
                                    this.body = app.wrapper.res.error({message: '当前流水记录已经结转!'});
                                    yield next;
                                    return;
                                }

                                amountOfElderlyJournalAccount = (elderly.journal_account[index].revenue_and_expenditure_type.substr(0, 1) == 'B' ? -1 : 1) *  elderly.journal_account[index].amount;

                                console.log('前置检查完成');
                                console.log(elderly.journal_account.length);
                                elderly.journal_account.splice(index,1);
                                console.log(elderly.journal_account.length);
                                //冲红是支出，并且是撤销-=
                                elderly.subsidiary_ledger.self -= amountOfElderlyJournalAccount;

                                yield elderly.save();
                                steps = 'A';
                            }

                            raw_red_status = red.status;
                            raw_red_operated_by = red.operated_by;
                            raw_red_operated_by_name = red.operated_by_name;

                            red.status = 0;
                            red.operated_by = operated_by;
                            red.operated_by_name = operated_by_name;

                            yield red.save();
                            steps += 'B';

                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps) {
                                for (var i = 0; i < steps.length; i++) {
                                    switch (i) {
                                        case 0:
                                            elderly.subsidiary_ledger = raw_elderly_subsidiary_ledger;
                                            elderly.journal_account = raw_elderly_journal_account;
                                            yield elderly.save();
                                            break;
                                        case 1:
                                            if(steps[i] == 'A'){
                                                tenant.subsidiary_ledger = raw_tenant_subsidiary_ledger;
                                                yield tenant.save();
                                            }
                                            break;
                                        case 2:
                                            tenantJournalAccount_to_red.status = raw_tenantJournalAccountStatus;
                                            yield tenantJournalAccount_to_red.save();
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
                method: 'changeRedBookingAmountToElderlyRecharge',
                verb: 'post',
                url: this.service_url_prefix + "/changeRedBookingAmountToElderlyRecharge/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var red,recharge_to_red,tenantJournalAccount_to_red,elderly, tenant;
                        var raw_red_operated_by,raw_red_operated_by_name,raw_elderly_subsidiary_ledger, raw_elderly_journal_account,raw_tenantJournalAccountAmount,raw_tenant_subsidiary_ledger;
                        try {
                            var operated_by = this.request.body.operated_by;
                            var operated_by_name = this.request.body.operated_by_name;
                            if (!operated_by) {
                                this.body = app.wrapper.res.error({message: '缺少操作人数据!'});
                                yield next;
                                return;
                            }

                            red = yield app.modelFactory().model_read(app.models['pub_red'], this.params._id);
                            if (!red || red.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到充红记录!'});
                                yield next;
                                return;
                            }

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], red.tenantId);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }

                            recharge_to_red = yield app.modelFactory().model_one(app.models['psn_recharge'], {
                                where: {
                                    status: 1,
                                    voucher_no: red.voucher_no_to_red,
                                    tenantId: red.tenantId
                                }
                            });

                            var newBookingAmount =  red.amount;
                            var oldBookingAmount = 0;
                            var elderlyId;
                            recharge_to_red && recharge_to_red.status == 1 && (elderlyId = recharge_to_red.elderlyId);

                            if(!elderlyId){
                                //撤销冲红的是系统内部流水
                                tenantJournalAccount_to_red = yield app.modelFactory().model_one(app.models['pub_tenantJournalAccount'], {
                                    where: {
                                        status: 1,
                                        voucher_no: red.voucher_no,
                                        tenantId: red.tenantId,
                                        red_flag: true
                                    }
                                });

                                if(!tenantJournalAccount_to_red){
                                    this.body = app.wrapper.res.error({message: '无法找到需要修改的流水记录!'});
                                    yield next;
                                    return;
                                }
                                else if(tenantJournalAccount_to_red.carry_over_flag){
                                    this.body = app.wrapper.res.error({message: '当前流水记录已经结转!'});
                                    yield next;
                                    return;
                                }

                                var index = -1,elderly_json, amountOfElderlyJournalAccountToCancel, amountOfElderlyJournalAccountToRed
                                //通过source_type,source_id找到对应的老人冲红流水删除
                                if(tenantJournalAccount_to_red.source_type == app.modelVariables.SOURCE_TYPES.ELDERLY){
                                    elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], tenantJournalAccount_to_red.source_id);
                                    if (!elderly || elderly.status == 0) {
                                        this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                        yield next;
                                        return;
                                    }
                                    if (!elderly.live_in_flag || elderly.begin_exit_flow) {
                                        this.body = app.wrapper.res.error({message: '当前老人不在院或正在办理出院手续，无法修改冲红!'});
                                        yield next;
                                        return;
                                    }

                                    elderly_json = elderly.toObject();
                                    raw_elderly_subsidiary_ledger = app.clone(elderly_json.subsidiary_ledger);
                                    raw_elderly_journal_account = app.clone(elderly_json.journal_account);

                                    for(var i= 0;i<elderly.journal_account.length;i++) {
                                        if (elderly.journal_account[i].voucher_no == red.voucher_no && elderly.journal_account[i].red_flag) {
                                            index = i;
                                            oldBookingAmount = elderly.journal_account[i].amount;
                                            elderly.journal_account[i].amount = newBookingAmount;
                                            break;
                                        }
                                    }

                                    console.log(oldBookingAmount);
                                    console.log(newBookingAmount);

                                    if(index == -1){
                                        this.body = app.wrapper.res.error({message: '无法找到需要撤销的老人流水记录!'});
                                        yield next;
                                        return;
                                    }

                                    if(elderly.journal_account[index].carry_over_flag){
                                        this.body = app.wrapper.res.error({message: '当前流水记录已经结转!'});
                                        yield next;
                                        return;
                                    }

                                    amountOfElderlyJournalAccountToCancel = (elderly.journal_account[index].revenue_and_expenditure_type.substr(0, 1) == 'B' ? -1 : 1) *  oldBookingAmount;
                                    amountOfElderlyJournalAccountToRed = (elderly.journal_account[index].revenue_and_expenditure_type.substr(0, 1) == 'B' ? -1 : 1) *  newBookingAmount;

                                    console.log('前置检查完成');
                                    //冲红是支出，并且先撤销-=，后冲红+=
                                    elderly.subsidiary_ledger.self -= amountOfElderlyJournalAccountToCancel;
                                    elderly.subsidiary_ledger.self += amountOfElderlyJournalAccountToRed;

                                    yield elderly.save();
                                    steps = 'A';
                                }
                                else{
                                    this.body = app.wrapper.res.error({message: '当前流水没有记录来源，无法修改冲红!'});
                                    yield next;
                                    return;
                                }

                                var tenant_json = tenant.toObject();
                                raw_tenant_subsidiary_ledger = app.clone(tenant_json.subsidiary_ledger);
                                raw_tenantJournalAccountAmount = tenantJournalAccount_to_red.amount;

                                //更新租户分类账,先撤销冲红-=，后冲红+=
                                tenant.subsidiary_ledger.self -=  (tenantJournalAccount_to_red.revenue_and_expenditure_type.substr(0, 1) == 'B' ? -1 : 1) * oldBookingAmount;
                                tenant.subsidiary_ledger.self +=  (tenantJournalAccount_to_red.revenue_and_expenditure_type.substr(0, 1) == 'B' ? -1 : 1) * newBookingAmount;
                                yield tenant.save();
                                steps += 'A';

                                tenantJournalAccount_to_red.amount = newBookingAmount;
                                yield tenantJournalAccount_to_red.save();
                                steps += 'A';

                            }
                            else{
                                //撤销冲红的是充值记录，则通过其找到目标老人

                                elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], recharge_to_red.elderlyId);
                                if (!elderly || elderly.status == 0) {
                                    this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                    yield next;
                                    return;
                                }

                                if (!elderly.live_in_flag || elderly.begin_exit_flow) {
                                    this.body = app.wrapper.res.error({message: '当前老人不在院或正在办理出院手续，无法记账!'});
                                    yield next;
                                    return;
                                }

                                elderly_json = elderly.toObject();
                                raw_elderly_subsidiary_ledger = app.clone(elderly_json.subsidiary_ledger);
                                raw_elderly_journal_account = app.clone(elderly_json.journal_account);

                                console.log('red.voucher_no:'+red.voucher_no);
                                for(var i= 0;i<elderly.journal_account.length;i++) {

                                    if (elderly.journal_account[i].voucher_no == red.voucher_no && elderly.journal_account[i].red_flag) {
                                        index = i;
                                        oldBookingAmount = elderly.journal_account[i].amount;
                                        elderly.journal_account[i].amount = newBookingAmount;
                                        break;
                                    }
                                }

                                console.log(oldBookingAmount);
                                console.log(newBookingAmount);

                                if(index == -1){
                                    this.body = app.wrapper.res.error({message: '无法找到需要修改的老人流水记录!'});
                                    yield next;
                                    return;
                                }

                                if(elderly.journal_account[index].carry_over_flag){
                                    this.body = app.wrapper.res.error({message: '当前流水记录已经结转!'});
                                    yield next;
                                    return;
                                }

                                amountOfElderlyJournalAccountToCancel = (elderly.journal_account[index].revenue_and_expenditure_type.substr(0, 1) == 'B' ? -1 : 1) *  oldBookingAmount;
                                amountOfElderlyJournalAccountToRed = (elderly.journal_account[index].revenue_and_expenditure_type.substr(0, 1) == 'B' ? -1 : 1) *  newBookingAmount;

                                console.log('前置检查完成');
                                //冲红是支出，并且先撤销-= 后冲红+=
                                elderly.subsidiary_ledger.self -= amountOfElderlyJournalAccountToCancel;
                                elderly.subsidiary_ledger.self += amountOfElderlyJournalAccountToRed;

                                yield elderly.save();
                                steps = 'A';
                            }


                            raw_red_operated_by = red.operated_by;
                            raw_red_operated_by_name = red.operated_by_name;

                            red.operated_by = operated_by;
                            red.operated_by_name = operated_by_name;

                            yield red.save();
                            steps += 'B';

                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps) {
                                for (var i = 0; i < steps.length; i++) {
                                    switch (i) {
                                        case 0:
                                            elderly.subsidiary_ledger = raw_elderly_subsidiary_ledger;
                                            elderly.journal_account = raw_elderly_journal_account;
                                            yield elderly.save();
                                            break;
                                        case 1:
                                            if(steps[i] == 'A'){
                                                tenant.subsidiary_ledger = raw_tenant_subsidiary_ledger;
                                                yield tenant.save();
                                            }
                                            break;
                                        case 2:
                                            tenantJournalAccount_to_red.amount = raw_tenantJournalAccountAmount;
                                            yield tenantJournalAccount_to_red.save();
                                            break;
                                    }
                                }
                            }
                        }
                        yield next;
                    };
                }
            },
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
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
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
                                this.body = app.wrapper.res.error({message: '无法找到房间!'});
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
            /**********************房间配置相关*****************************/
            {
                method: 'robotRemoveRoomConfig',
                verb: 'post',
                url: this.service_url_prefix + "/robotRemoveRoomConfig",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var tenant,robot,rooms,room,robots;
                        try {
                            //this.request.body
                            var tenantId = this.request.body.tenantId;
                            var robotId = this.request.body.robotId;

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }

                            robot =  yield app.modelFactory().model_read(app.models['pub_robot'], robotId);
                            if(!robot || robot.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到机器人!'});
                                yield next;
                                return;
                            }

                            rooms = yield app.modelFactory().model_query(app.models['psn_room'], {
                                where:{
                                    robots: {$elemMatch:{$eq: robotId}},
                                    tenantId: tenantId
                                }
                            });
                            console.log(rooms);
                            if(rooms.length == 0){
                                this.body = app.wrapper.res.default();
                                yield next;
                                return;
                            }

                            console.log('前置检查完成');

                            for (var i=0, len=rooms.length;i<len;i++) {
                                room = rooms[i];
                                robots = room.toObject().robots;
                                var inIndex = robots.findIndex((o) => {
                                    return o == robotId
                                });

                                if(inIndex != -1) {
                                    robots.splice(inIndex, 1);
                                }
                                console.log(inIndex)
                                room.robots =  robots;
                                console.log(room.robots)
                                yield room.save();
                            }

                            this.body = app.wrapper.res.default();
                        }
                        catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'bedMonitorRemoveRoomConfig',
                verb: 'post',
                url: this.service_url_prefix + "/bedMonitorRemoveRoomConfig",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var tenant,bedMonitor,rooms,room,bedMonitors;
                        try {
                            //this.request.body
                            var tenantId = this.request.body.tenantId;
                            var bedMonitorId = this.request.body.bedMonitorId;

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }

                            bedMonitor =  yield app.modelFactory().model_read(app.models['pub_bedMonitor'], bedMonitorId);
                            if(!bedMonitor || bedMonitor.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到睡眠带!'});
                                yield next;
                                return;
                            }

                            rooms = yield app.modelFactory().model_query(app.models['psn_room'], {
                                where:{
                                    "bedMonitors.bedMonitorId": bedMonitorId, // bedMonitors: {$elemMatch:{bedMonitorId: bedMonitorId}},
                                    tenantId: tenantId
                                }
                            });

                            console.log(rooms);
                            if(rooms.length == 0){
                                this.body = app.wrapper.res.default();
                                yield next;
                                return;
                            }


                            console.log('前置检查完成');
                            for (var i=0, len=rooms.length;i<len;i++) {
                                room = rooms[i];
                                bedMonitors = room.toObject().bedMonitors;
                                var inIndex = bedMonitors.findIndex((o) => {
                                    return o.bedMonitorId == bedMonitorId
                                });

                                if(inIndex != -1) {
                                    bedMonitors.splice(inIndex, 1);
                                }
                                room.bedMonitors =  bedMonitors;
                                yield room.save();
                            }

                            this.body = app.wrapper.res.default();
                        }
                        catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            /**********************入院相关*****************************/
            {
                method: 'completeEnter',//完成入院
                verb: 'post',
                url: this.service_url_prefix + "/completeEnter/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var enter,tenant,elderly,roomStatus,roomOccupancyChangeHistory,recharge,
                            journal_account_item_A0001,journal_account_item_B0001,
                            tenantJournalAccount_A0001;
                        var raw_enter_operated_by,raw_enter_operated_by_name;
                        var old_current_register_step,old_live_in_flag,old_enter_code,old_enter_on,old_charging_on_of_monthly_prepay,old_remark,old_roomStatus_occupied,
                            old_elderly_journal_account,old_elderly_subsidiary_ledger,old_tenant_subsidiary_ledger;

                        var remove_roomStatus_id,remove_roomOccupancyChangeHistory_id,remove_tenantJournalAccount_A0001_id;
                        try {
                            var operated_by = this.request.body.operated_by;
                            var operated_by_name = this.request.body.operated_by_name;
                            if (!operated_by) {
                                this.body = app.wrapper.res.error({message: '缺少操作人数据!'});
                                yield next;
                                return;
                            }

                            //1、订单状态改为[入院成功]
                            enter = yield app.modelFactory().model_read(app.models['psn_enter'], this.params._id);

                            if(!enter || enter.status == 0 ) {
                                this.body = app.wrapper.res.error({message: '无法找到入院记录!'});
                                yield next;
                                return;
                            }
                            var enter_json = enter.toObject();
                            raw_enter_operated_by = enter_json.operated_by;
                            raw_enter_operated_by_name = enter_json.operated_by_name;
                            old_current_register_step = enter_json.current_register_step;
                            enter.operated_by = operated_by;
                            enter.operated_by_name = operated_by_name;
                            enter.current_register_step = 'A0007';
                            console.log('prepare 1');
                            //2、获取租户信息
                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], enter.tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到养老机构资料!'});
                                yield next;
                                return;
                            }
                            console.log('prepare 2');
                            //3、正式入院后从入院单中复制
                            elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], enter.elderlyId);
                            if(!elderly || elderly.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                yield next;
                                return;
                            }


                            var elderly_json = elderly.toObject();


                            old_live_in_flag = elderly.live_in_flag;
                            old_enter_code = undefined;
                            old_enter_on = undefined;
                            old_charging_on_of_monthly_prepay = undefined;
                            old_remark = elderly.remark;
                            if(!old_remark)
                                old_remark = undefined;

                            elderly.live_in_flag = true;
                            elderly.enter_code = enter.code;
                            elderly.enter_on = enter.enter_on;
                            elderly.charging_on_of_monthly_prepay = enter.enter_on;
                            if(!elderly.remark)
                                elderly.remark = enter.remark;
                            console.log('prepare 3');
                            //4、更新房间床位信息
                            var roomId = elderly.room_value.roomId;
                            var bed_no = elderly.room_value.bed_no;
                            roomStatus = yield app.modelFactory().model_one(app.models['psn_roomStatus'],{where:{roomId:roomId}});
                            if(!roomStatus){
                                roomStatus = {
                                    roomId: roomId,
                                    occupied: [{bed_no: bed_no, bed_status:'A0003', elderlyId: enter.elderlyId}],
                                    tenantId: enter.tenantId
                                };
                            }
                            else{
                                old_roomStatus_occupied = app.clone(roomStatus.toObject().occupied);
                                if(!old_roomStatus_occupied)
                                    old_roomStatus_occupied = undefined;

                                if(roomStatus.occupied){
                                    for(var i=0;i< roomStatus.occupied.length;i++ ) {
                                        console.log(typeof elderly.toObject()._id);
                                        console.log(typeof roomStatus.occupied[i].toObject().elderlyId);
                                        console.log(elderly._id.equals(roomStatus.occupied[i].elderlyId));
                                        if(roomStatus.occupied[i].bed_no==bed_no && elderly._id.equals(roomStatus.occupied[i].elderlyId)) {
                                            roomStatus.occupied[i].bed_status = 'A0003';
                                        }
                                    }
                                }
                            }

                            console.log('prepare 4');
                            //5、增加房间状态变动历史
                            roomOccupancyChangeHistory = {
                                roomId: roomId,
                                bed_no: bed_no,
                                room_summary: elderly.room_summary,
                                elderlyId: elderly._id,
                                elderly_summary: elderly.name + ' ' + elderly.id_no,
                                in_flag: true,
                                tenantId: enter.tenantId
                            };
                            console.log('prepare 5');
                            //6、增加老人资金流水
                            //6.1个人存款
                            journal_account_item_A0001 = {
                                voucher_no: yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.BOOKING_TO_TENANT,elderly_json.tenantId),
                                revenue_and_expenditure_type: 'A0001',
                                digest: '入院登记号:'+ enter.code + app.dictionary.pairs["D3002"]['A0001'].name,
                                amount: enter.deposit
                            };
                            //个人预存增加一条充值记录
                            recharge = {
                                operated_by: operated_by,
                                operated_by_name: operated_by_name,
                                enter_code: enter_json.code,
                                elderlyId: elderly._id,
                                elderly_name: elderly_json.name,
                                type: 'A0001',
                                amount: journal_account_item_A0001.amount,
                                voucher_no: journal_account_item_A0001.voucher_no,
                                remark: '老人入院时支付完成',
                                tenantId: elderly.tenantId
                            };

                            //6.2预付月租
                            journal_account_item_B0001 = {
                                voucher_no: yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.BOOKING_TO_TENANT,elderly_json.tenantId),
                                revenue_and_expenditure_type: 'B0001',
                                digest: app.moment().format('YYYY-MM'),
                                amount: enter.sum_period_price * 1
                            };

                            old_elderly_journal_account = app.clone(elderly_json.journal_account);
                            if(!old_elderly_journal_account)
                                old_elderly_journal_account = undefined;

                            if(!elderly.journal_account)
                                elderly.journal_account = [];
                            elderly.journal_account.push(journal_account_item_A0001);
                            elderly.journal_account.push(journal_account_item_B0001);
                            console.log('prepare 6');

                            //7、增加租户资金流水
                            tenantJournalAccount_A0001 = {
                                voucher_no : journal_account_item_B0001.voucher_no,
                                revenue_and_expenditure_type: 'A0001',
                                digest: elderly.name + ' ' + journal_account_item_B0001.digest,
                                amount: journal_account_item_B0001.amount,
                                source_type: app.modelVariables.SOURCE_TYPES.ELDERLY,
                                source_id: elderly._id,
                                source_key: '$journal_account.voucher_no',
                                tenantId: enter.tenantId
                            };
                            console.log('prepare 7');

                            //8、修改老人明细账
                            old_elderly_subsidiary_ledger = app.clone(elderly_json.subsidiary_ledger);
                            elderly.subsidiary_ledger.self += journal_account_item_A0001.amount - journal_account_item_B0001.amount;
                            console.log('prepare 8');
                            //9、修改租户明细账
                            old_tenant_subsidiary_ledger = app.clone(tenant.toObject().subsidiary_ledger);
                            tenant.subsidiary_ledger.self += tenantJournalAccount_A0001.amount;
                            console.log('prepare 9');
                            //commit 原子事务性保存

                            yield enter.save();
                            steps="A";
                            yield elderly.save();
                            steps+="A";
                            if(roomStatus._id){
                                yield roomStatus.save();
                                steps+="A";
                            }
                            else{
                                roomStatus = yield app.modelFactory().model_create(app.models['psn_roomStatus'], roomStatus);
                                remove_roomStatus_id = roomStatus._id;
                                steps+="B";
                            }
                            roomOccupancyChangeHistory = yield app.modelFactory().model_create(app.models['psn_roomOccupancyChangeHistory'], roomOccupancyChangeHistory);
                            remove_roomOccupancyChangeHistory_id = roomOccupancyChangeHistory._id;
                            steps+="A";
                            tenantJournalAccount_A0001 = yield app.modelFactory().model_create(app.models['pub_tenantJournalAccount'], tenantJournalAccount_A0001);
                            remove_tenantJournalAccount_A0001_id = tenantJournalAccount_A0001._id;
                            steps+="A";
                            yield tenant.save();
                            steps+="A";
                            recharge = yield app.modelFactory().model_create(app.models['psn_recharge'], recharge);

                            this.body = app.wrapper.res.ret({current_register_step: enter.current_register_step});
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps){
                                for(var i=0;i<steps.length;i++) {
                                    switch(i){
                                        case 0:
                                            enter.operated_by = raw_enter_operated_by;
                                            enter.operated_by_name = raw_enter_operated_by_name;
                                            enter.current_register_step = old_current_register_step;
                                            yield enter.save();
                                            break;
                                        case 1:
                                            elderly.live_in_flag = old_live_in_flag;
                                            elderly.enter_code = old_enter_code;
                                            elderly.enter_on = old_enter_on;
                                            elderly.charging_on_of_monthly_prepay = old_charging_on_of_monthly_prepay;
                                            elderly.remark = old_remark;
                                            elderly.journal_account = old_elderly_journal_account;
                                            elderly.subsidiary_ledger =old_elderly_subsidiary_ledger;
                                            yield elderly.save();
                                            break;
                                        case 2:
                                            if(steps[i] == 'A'){
                                                //修改
                                                roomStatus.occupied = old_roomStatus_occupied;
                                                yield roomStatus.save();
                                            }
                                            else{
                                                //删除
                                                yield app.modelFactory().delete(roomStatusModelOption.model_name,roomStatusModelOption.model_path, remove_roomStatus_id);
                                            }
                                            break;
                                        case 3:
                                            yield app.modelFactory().model_delete(app.models['psn_roomOccupancyChangeHistory'],remove_roomOccupancyChangeHistory_id);
                                            break;
                                        case 4:
                                            yield app.modelFactory().model_delete(app.models['pub_tenantJournalAccount'], remove_tenantJournalAccount_A0001_id);
                                            break;
                                        case 5:
                                            tenant.subsidiary_ledger = old_tenant_subsidiary_ledger;
                                            tenant.save();
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
                method: 'disableEnterRelatedAction',//作废入院记录的相关动作
                verb: 'post',
                url: this.service_url_prefix + "/disableEnterRelatedAction/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var enter,tenant,elderly;
                        var toUpdateRoomStatus = [];
                        var arr_old_roomStatus_occupied = [];

                        try {
                            //1、订单状态改为[入院成功]
                            enter = yield app.modelFactory().model_read(app.models['psn_enter'], this.params._id);
                            if(!enter  || enter.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到入院记录!'});
                                yield next;
                                return;
                            }
                            console.log('prepare 1');
                            //2、获取租户信息
                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], enter.tenantId);
                            if(!tenant  || tenant.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }
                            console.log('prepare 2');
                            //3、判断老人是否在院
                            elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], enter.elderlyId);
                            if(!elderly || elderly.status == 0 ){
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }
                            if(elderly.live_in_flag){
                                this.body = app.wrapper.res.error({message: '老人已经在院，必须办理出院手续!'});
                                yield next;
                                return;
                            }

                            //解除预占用
                            var roomStatuses  = yield app.modelFactory().model_query(app.models['psn_roomStatus'], {where: {tenantId: enter.tenantId}});
                            for(var i=0;i<roomStatuses.length;i++) {
                                if(roomStatuses[i].occupied){
                                    var old_roomStatus_occupied = app.clone(roomStatuses[i].toObject().occupied);

                                    for(var j=0;j<roomStatuses[i].occupied.length;j++){
                                        var occupy = roomStatuses[i].occupied[j];
                                        if (elderly._id.equals(occupy.elderlyId)) {
                                            occupy.bed_status = 'A0001';
                                            occupy.elderlyId = undefined;
                                            arr_old_roomStatus_occupied.push(old_roomStatus_occupied);
                                            toUpdateRoomStatus.push(roomStatuses[i]);
                                        }
                                    }
                                }
                            }

                            for(var i=0;i<toUpdateRoomStatus.length;i++) {
                                yield toUpdateRoomStatus[i].save();
                                steps += "A";
                            }

                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps){
                                for(var i=0;i<steps.length;i++) {
                                    var roomStatus = toUpdateRoomStatus[i];
                                    roomStatus.occupied = arr_old_roomStatus_occupied[i];
                                    yield roomStatus.save();
                                }
                            }

                        }
                        yield next;
                    };
                }
            },
            {
                method: 'checkBeforeAddEnter',//入院前前检测
                verb: 'get',
                url: this.service_url_prefix + "/checkBeforeAddEnter/:tenantId/:id_no",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var enter, tenant, elderly;
                        var toUpdateRoomStatus = [];
                        var arr_old_roomStatus_occupied = [];

                        try {
                            var tenantId = this.params.tenantId;
                            var id_no = this.params.id_no;
                            var canAdd = true;

                            //1、获取租户信息
                            tenant = yield app.modelFactory().model_read(app.models["pub_tenant"], tenantId);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到养老机构资料!'});
                                yield next;
                                return;
                            }
                            console.log('prepare 1');
                            //2、判断老人是否在院
                            elderly = yield app.modelFactory().model_one(app.models['psn_elderly'], {
                                where: {
                                    id_no: id_no,
                                    tenantId: tenantId
                                },
                                select:'_id status live_in_flag name id_no sex birthday marriage home_address family_members medical_insurance politics_status inhabit_status financial_status hobbies medical_histories remark'
                            });
                            if (elderly && elderly.status == 1) {

                                if (elderly.live_in_flag) {
                                    console.log('老人已经在院，无法办理入院手续!');
                                    this.body = app.wrapper.res.error({message: '老人已经在院，无法办理入院手续!'});
                                    yield next;
                                    return;
                                }
                            }
                            console.log('prepare 2');
                            //3、判断老人是否同时存在其他未确认的入院记录
                            if (elderly && elderly._id) {
                                var enters = yield app.modelFactory().model_query(app.models['psn_enter'], {
                                    where: {
                                        elderlyId: elderly._id,
                                        current_register_step: {"$in": ['A0001', 'A0003', 'A0005']},
                                        tenantId: tenantId,
                                        status: 1
                                    }
                                });

                                if (enters && enters.length > 0) {
                                    this.body = app.wrapper.res.error({message: '系统检测到该老人已经存在其他入院记录，无法办理入院手续!'});
                                    yield next;
                                    return;
                                }
                            }

                            this.body = app.wrapper.res.ret({elderly: elderly});
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                        }
                        yield next;
                    };
                }
            },
            /**********************出院相关*****************************/
            {
                method: 'submitApplicationToExit',//提交出院申请
                verb: 'post',
                url: this.service_url_prefix + "/submitApplicationToExit/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var elderly,newExit;
                        var raw_elderly_begin_exit_flow;
                        try {

                            var operated_by = this.request.body.operated_by;
                            var operated_by_name = this.request.body.operated_by_name;

                            if (!operated_by) {
                                this.body = app.wrapper.res.error({message: '缺少操作人数据!'});
                                yield next;
                                return;
                            }

                            //1、判断老人是否在院
                            elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], this.params._id);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                yield next;
                                return;
                            }
                            if (!elderly.live_in_flag) {
                                this.body = app.wrapper.res.error({message: '老人已经出院!'});
                                yield next;
                                return;
                            }

                            if (elderly.begin_exit_flow || (yield app.modelFactory().model_totals(app.models['psn_exit'], {
                                    where: {
                                        tenantId: elderly.tenantId,
                                        elderlyId: elderly._id,
                                        enter_code: elderly.enter_code
                                    }
                                })).length > 0) {
                                this.body = app.wrapper.res.error({message: '老人出院申请已经提交，请按照出院流程办理出院手续!'});
                                yield next;
                                return;
                            }


                            console.log('前置检查完成');

                            //更改老人
                            raw_elderly_begin_exit_flow = elderly.begin_exit_flow;
                            elderly.begin_exit_flow = true;

                            //出院申请
                            newExit = {
                                operated_by: operated_by,
                                operated_by_name: operated_by_name,
                                current_step: 'A0001',
                                enter_code: elderly.enter_code,
                                enter_on: elderly.enter_on,
                                elderlyId: elderly._id,
                                elderly_name: elderly.name,
                                elderly_id_no: elderly.id_no,
                                elderly_sex: elderly.sex,
                                elderly_birthday: elderly.birthday,
                                elderly_home_address: elderly.home_address,
                                tenantId: elderly.tenantId
                            };


                            yield elderly.save();
                            steps = "A";
                            newExit = yield app.modelFactory().model_create(app.models['psn_exit'], newExit);

                            this.body = app.wrapper.res.ret({begin_exit_flow: elderly.begin_exit_flow});
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps){
                                for(var i=0;i<steps.length;i++) {
                                    switch(i) {
                                        case 0:
                                            elderly.begin_exit_flow = raw_elderly_begin_exit_flow;
                                            yield elderly.save();
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
                method: 'submitToAuditItemReturn',//提交归还物品检查
                verb: 'post',
                url: this.service_url_prefix + "/submitToAuditItemReturn/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var exit;
                        try {
                            exit = yield app.modelFactory().model_read(app.models['psn_exit'], this.params._id);
                            if (!exit || exit.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人出院申请!'});
                                yield next;
                                return;
                            }
                            if (exit.current_step!='A0001') {
                                this.body = app.wrapper.res.error({message: '出院流程步骤错误，当前状态下不能提交!'});
                                yield next;
                                return;
                            }

                            console.log('前置检查完成');

                            exit.current_step = 'A0003';

                            yield exit.save();

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
                method: 'submitToAuditSettlement',//提交出院结算审核
                verb: 'post',
                url: this.service_url_prefix + "/submitToAuditSettlement/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var exit;
                        try {
                            var operated_by = this.request.body.operated_by;
                            var operated_by_name = this.request.body.operated_by_name;
                            if (!operated_by) {
                                this.body = app.wrapper.res.error({message: '缺少操作人数据!'});
                                yield next;
                                return;
                            }

                            exit = yield app.modelFactory().model_read(app.models['psn_exit'], this.params._id);
                            if (!exit || exit.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人出院申请!'});
                                yield next;
                                return;
                            }
                            if (exit.current_step!='A0003') {
                                this.body = app.wrapper.res.error({message: '出院流程步骤错误，当前状态下不能提交!'});
                                yield next;
                                return;
                            }

                            console.log('前置检查完成');

                            exit.current_step = 'A0005';
                            if(!exit.item_return_audit)
                                exit.item_return_audit = {};
                            exit.item_return_audit.operated_by = operated_by;
                            exit.item_return_audit.operated_by_name = operated_by_name;
                            exit.item_return_audit.pass_flag = true;
                            exit.item_return_audit.comment = this.request.body.comment;

                            yield exit.save();

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
                method: 'submitToConfirmExit',//提交到确认出院步骤
                verb: 'post',
                url: this.service_url_prefix + "/submitToConfirmExit/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var exit;
                        try {
                            var operated_by = this.request.body.operated_by;
                            var operated_by_name = this.request.body.operated_by_name;
                            if (!operated_by) {
                                this.body = app.wrapper.res.error({message: '缺少操作人数据!'});
                                yield next;
                                return;
                            }

                            exit = yield app.modelFactory().model_read(app.models['psn_exit'], this.params._id);
                            if (!exit || exit.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人出院申请!'});
                                yield next;
                                return;
                            }
                            if (exit.current_step!='A0005') {
                                this.body = app.wrapper.res.error({message: '出院流程步骤错误，当前状态下不能提交!'});
                                yield next;
                                return;
                            }

                            console.log('前置检查完成');

                            exit.current_step = 'A0007';
                            if(!exit.settlement_audit)
                                exit.settlement_audit = {};
                            exit.settlement_audit.operated_by = operated_by;
                            exit.settlement_audit.operated_by_name = operated_by_name;
                            exit.settlement_audit.pass_flag = true;
                            exit.settlement_audit.comment = this.request.body.comment;

                            yield exit.save();

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
                method: 'advancePaymentItemsWhenExitSettlement',
                verb: 'get',
                url: this.service_url_prefix + "/advancePaymentItemsWhenExitSettlement/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var exit = yield app.modelFactory().model_read(app.models['psn_exit'], this.params._id);
                            if (!exit || exit.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人出院申请!'});
                                yield next;
                                return;
                            }

                            var elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], exit.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                yield next;
                                return;
                            }

                            if(!elderly.begin_exit_flow){
                                this.body = app.wrapper.res.error({message: '当前老人没有办理出院流程，无法获取结算信息!'});
                                yield next;
                                return;
                            }

                            var advancePaymentItems = [];

                            var balance_brought_forward_payment_item = {digest: '上期结转', amount: elderly.general_ledger};
                            advancePaymentItems.push(balance_brought_forward_payment_item);
                            var arr_journal_account = elderly.journal_account;
                            for(var i=0;i<arr_journal_account.length;i++) {
                                if (arr_journal_account[i].carry_over_flag == false && (arr_journal_account[i].revenue_and_expenditure_type == 'A0001' || arr_journal_account[i].revenue_and_expenditure_type == 'A0002')) {
                                    advancePaymentItems.push({
                                        digest: app.dictionary.pairs["D3002"][arr_journal_account[i].revenue_and_expenditure_type].name + ':' + arr_journal_account[i].digest,
                                        amount: arr_journal_account[i].amount
                                    });
                                }
                            }

                            this.body = app.wrapper.res.rows(advancePaymentItems);

                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'chargeItemsRecordedWhenExitSettlement',
                verb: 'get',
                url: this.service_url_prefix + "/chargeItemsRecordedWhenExitSettlement/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var exit = yield app.modelFactory().model_read(app.models['psn_exit'], this.params._id);
                            if (!exit || exit.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人出院申请!'});
                                yield next;
                                return;
                            }

                            var elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], exit.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }

                            if(!elderly.begin_exit_flow){
                                this.body = app.wrapper.res.error({message: '当前老人没有办理出院流程，无法获取结算信息!'});
                                yield next;
                                return;
                            }

                            var chargeItems = [];
                            var arr_journal_account = elderly.journal_account;
                            for(var i=0;i<arr_journal_account.length;i++) {
                                if (arr_journal_account[i].carry_over_flag == false && arr_journal_account[i].revenue_and_expenditure_type != 'A0001' && arr_journal_account[i].revenue_and_expenditure_type != 'A0002') {
                                    var revenue_and_expenditure_type_Prefix = arr_journal_account[i].revenue_and_expenditure_type.substr(0,1);
                                    chargeItems.push({
                                        digest: app.dictionary.pairs["D3002"][arr_journal_account[i].revenue_and_expenditure_type].name + ':' + arr_journal_account[i].digest,
                                        amount: (revenue_and_expenditure_type_Prefix == 'A' ? -1 : 1) * arr_journal_account[i].amount
                                    });
                                }
                            }


                            this.body = app.wrapper.res.rows(chargeItems);

                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'chargeItemsUnRecordedWhenExitSettlement',
                verb: 'get',
                url: this.service_url_prefix + "/chargeItemsUnRecordedWhenExitSettlement/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var exit = yield app.modelFactory().model_read(app.models['psn_exit'], this.params._id);
                            if (!exit || exit.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人出院申请!'});
                                yield next;
                                return;
                            }

                            var elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], exit.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }

                            if(!elderly.begin_exit_flow){
                                this.body = app.wrapper.res.error({message: '当前老人没有办理出院流程，无法获取结算信息!'});
                                yield next;
                                return;
                            }

                            var elderly_json = elderly.toObject();

                            //1、寻找最后一次的预付月租并计算到今天为止应该退还多少租金
                            var chargeItems = [];

                            //改用elderly.charging_on_of_monthly_prepay
                            var firstPrepayDate = elderly.charging_on_of_monthly_prepay;
                            if(!firstPrepayDate) {
                                var arr_journal_account_B0001 = app._.where(elderly_json.journal_account, {revenue_and_expenditure_type: 'B0001'});
                                var latest_journal_account_B0001 = app._.max(arr_journal_account_B0001, function (item) {
                                    return item.check_in_time;
                                });

                                firstPrepayDate = latest_journal_account_B0001.check_in_time;
                            }
                            var daysOfMonthOnAverage = 30;
                            var monthly_prepay_price = app._.reduce(app._.pluck(elderly_json.charge_items,'period_price'),function(total,period_price){
                                return total + period_price;
                            },0);

                            var charge_item_day_price = monthly_prepay_price / daysOfMonthOnAverage;

                            var remainder = daysOfMonthOnAverage - app.moment().diff(firstPrepayDate,'days') % daysOfMonthOnAverage;
                            var refund = (charge_item_day_price * remainder).toFixed(2);

                            chargeItems.push({
                                digest: app.dictionary.pairs["D3002"]['A0003'].name + ':' + remainder + '天预收款',
                                amount: -1 * refund
                            });
                            //2、赔偿物品


                            this.body = app.wrapper.res.rows(chargeItems);

                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'exitSettlement',//出院结算
                verb: 'post',
                url: this.service_url_prefix + "/exitSettlement/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var exit, elderly, tenant;
                        var raw_elderly_general_ledger, raw_elderly_subsidiary_ledger, raw_elderly_journal_account;
                        var raw_tenant_general_ledger, raw_tenant_subsidiary_ledger;
                        var raw_exit_settlement_info;
                        var new_elderly_journal_account_item_A0003;//未入账费用当前仅A0003预付月租退款
                        var new_tenantJournalAccount_B0006,remove_tenantJournalAccount_B0006_id;
                        var new_elderly_journal_account_item, new_tenantJournalAccount_item,remove_tenantJournalAccount_item_id;
                        try {
                            var operated_by = this.request.body.operated_by;
                            var operated_by_name = this.request.body.operated_by_name;
                            if (!operated_by) {
                                this.body = app.wrapper.res.error({message: '缺少操作人数据!'});
                                yield next;
                                return;
                            }

                            exit = yield app.modelFactory().model_read(app.models['psn_exit'], this.params._id);
                            if (!exit || exit.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人出院申请!'});
                                yield next;
                                return;
                            }
                            if (exit.current_step != 'A0005') {
                                this.body = app.wrapper.res.error({message: '出院流程步骤错误，当前状态下不能提交!'});
                                yield next;
                                return;
                            }

                            elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], exit.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }

                            if (!elderly.begin_exit_flow) {
                                this.body = app.wrapper.res.error({message: '当前老人没有办理出院流程，无法结算!'});
                                yield next;
                                return;
                            }

                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], exit.tenantId);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到养老机构资料!'});
                                yield next;
                                return;
                            }


                            var exit_json = exit.toObject();
                            var elderly_json = elderly.toObject();
                            var tenant_json = tenant.toObject();
                            console.log('前置检查完成');

                            raw_elderly_general_ledger = elderly_json.general_ledger;
                            raw_elderly_subsidiary_ledger = app.clone(elderly_json.subsidiary_ledger);
                            raw_elderly_journal_account = app.clone(elderly_json.journal_account);
                            raw_tenant_general_ledger = tenant_json.general_ledger;
                            raw_tenant_subsidiary_ledger = app.clone(tenant_json.subsidiary_ledger);
                            if(exit_json.settlement_info){
                                raw_exit_settlement_info = app.clone(tenant_json.settlement_info);
                            }
                            else{
                                raw_exit_settlement_info = undefined;
                            }


                            //预缴金额
                            var advancePayment = elderly_json.general_ledger;
                            var arr_journal_account = elderly_json.journal_account;
                            for (var i = 0; i < arr_journal_account.length; i++) {
                                if (arr_journal_account[i].carry_over_flag == false && (arr_journal_account[i].revenue_and_expenditure_type == 'A0001' || arr_journal_account[i].revenue_and_expenditure_type == 'A0002')) {
                                    advancePayment += arr_journal_account[i].amount;
                                }
                            }

                            //已入账费用合计
                            var recorded_charge_total = 0;
                            var arr_journal_account = elderly_json.journal_account;
                            for (var i = 0; i < arr_journal_account.length; i++) {
                                if (arr_journal_account[i].carry_over_flag == false && arr_journal_account[i].revenue_and_expenditure_type != 'A0001' && arr_journal_account[i].revenue_and_expenditure_type != 'A0002') {
                                    var revenue_and_expenditure_type_Prefix = arr_journal_account[i].revenue_and_expenditure_type.substr(0, 1);
                                    recorded_charge_total += (revenue_and_expenditure_type_Prefix == 'A' ? -1 : 1) * arr_journal_account[i].amount;
                                }
                            }

                            //未入账费用合计 改用elderly.charging_on_of_monthly_prepay
                            var unrecorded_charge_total = 0;
                            var firstPrepayDate = elderly.charging_on_of_monthly_prepay;
                            if(!firstPrepayDate) {
                                var arr_journal_account_B0001 = app._.where(elderly_json.journal_account, {revenue_and_expenditure_type: 'B0001'});
                                var latest_journal_account_B0001 = app._.max(arr_journal_account_B0001, function (item) {
                                    return item.check_in_time;
                                });
                                firstPrepayDate = latest_journal_account_B0001.check_in_time;
                            }
                            var daysOfMonthOnAverage = 30;
                            var monthly_prepay_price = app._.reduce(app._.pluck(elderly_json.charge_items, 'period_price'), function (total, period_price) {
                                return total + period_price;
                            }, 0);

                            var charge_item_day_price = monthly_prepay_price / daysOfMonthOnAverage;
                            var remainder = daysOfMonthOnAverage - app.moment().diff(firstPrepayDate, 'days') % daysOfMonthOnAverage;
                            var refund = (charge_item_day_price * remainder);

                            //未入账费用
                            unrecorded_charge_total += -1 * refund;

                            //记入老人资金流水
                            //此处因为是最后一次的出院结算，因此直接将结算标志设置为true
                            new_elderly_journal_account_item_A0003 = {
                                voucher_no: yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.BOOKING_TO_TENANT,elderly_json.tenantId),
                                revenue_and_expenditure_type: 'A0003',
                                digest: app.moment().format('YYYY-MM-DD') + ':' + app.dictionary.pairs["D3002"]['A0003'].name + '并退回' + remainder + '天预收款',
                                carry_over_flag: true,
                                amount: refund
                            };
                            elderly.journal_account.push(new_elderly_journal_account_item_A0003);

                            //更新老人分类账
                            elderly.subsidiary_ledger.self = elderly.subsidiary_ledger.self + refund;

                            //记录租户流水账(不在此处结算)
                            new_tenantJournalAccount_B0006 = {
                                voucher_no: new_elderly_journal_account_item_A0003.voucher_no,
                                revenue_and_expenditure_type: 'B0006',
                                digest: elderly.name + ' ' + new_elderly_journal_account_item_A0003.digest,
                                amount: new_elderly_journal_account_item_A0003.amount,
                                source_type: app.modelVariables.SOURCE_TYPES.ELDERLY,
                                source_id: elderly._id,
                                source_key: '$journal_account.voucher_no',
                                tenantId: elderly.tenantId
                            };
                            //更新租户分类账
                            tenant.subsidiary_ledger.self += -new_tenantJournalAccount_B0006.amount;


                            //更新明细流水结算
                            for(var i=0;i<elderly.journal_account.length;i++) {
                                if (!elderly.journal_account[i].carry_over_flag) {
                                    elderly.journal_account[i].carry_over_flag = true;
                                }
                            }

                            //更新老人总账
                            elderly.general_ledger = advancePayment - (recorded_charge_total + unrecorded_charge_total);

                            if (elderly.general_ledger != 0) {

                                var sign =  elderly.general_ledger > 0 ? -1 : 1;
                                new_elderly_journal_account_item = {
                                    voucher_no: yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.BOOKING_TO_TENANT,elderly_json.tenantId),
                                    revenue_and_expenditure_type: elderly.general_ledger > 0 ? 'B0002' : 'A0004',//租户需要退款给老人:老人需要补缴给租户欠费
                                    digest: '出院' + exit.enter_code,
                                    carry_over_flag: true,
                                    amount: elderly.general_ledger
                                };
                                elderly.journal_account.push(new_elderly_journal_account_item);

                                //计算结果老人分类账应该为0
                                new_tenantJournalAccount_item = {
                                    voucher_no : new_elderly_journal_account_item.voucher_no,
                                    revenue_and_expenditure_type: elderly.general_ledger > 0 ? 'B0007' : 'A0004',//租户需要退款给老人:老人需要补缴给租户欠费
                                    digest:  elderly.name + ' ' + new_elderly_journal_account_item.digest,
                                    amount: new_elderly_journal_account_item.amount,
                                    source_type: app.modelVariables.SOURCE_TYPES.ELDERLY,
                                    source_id: elderly._id,
                                    source_key: '$journal_account.voucher_no',
                                    tenantId: elderly.tenantId
                                };

                                elderly.subsidiary_ledger.self += sign * new_elderly_journal_account_item.amount;
                                elderly.general_ledger = 0;
                                tenant.subsidiary_ledger.self += sign * new_tenantJournalAccount_item.amount;

                            }


                            //更新出院结算信息
                            if(!exit.settlement_info){
                                exit.settlement_info = {};
                            }
                            exit.settlement_info.operated_on = app.moment();
                            exit.settlement_info.operated_by = operated_by;
                            exit.settlement_info.operated_by_name = operated_by_name;
                            exit.settlement_info.settlement_flag = true;
                            exit.settlement_info.advance_payment_amount = advancePayment;
                            exit.settlement_info.charge_total = recorded_charge_total + unrecorded_charge_total;


                            yield exit.save();
                            steps="A";

                            yield elderly.save();
                            steps+="A";

                            new_tenantJournalAccount_B0006 = yield app.modelFactory().model_create(app.models['pub_tenantJournalAccount'], new_tenantJournalAccount_B0006);
                            remove_tenantJournalAccount_B0006_id = new_tenantJournalAccount_B0006._id;
                            steps+="A";
                            new_tenantJournalAccount_item = yield app.modelFactory().model_create(app.models['pub_tenantJournalAccount'], new_tenantJournalAccount_item);
                            remove_tenantJournalAccount_item_id = new_tenantJournalAccount_item._id;
                            steps+="A";

                            yield tenant.save();

                            this.body = app.wrapper.res.ret(exit.settlement_info);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps){
                                for(var i=0;i<steps.length;i++) {
                                    switch(i){
                                        case 0:
                                            exit.settlement_info = raw_exit_settlement_info;
                                            yield exit.save();
                                            break;
                                        case 1:
                                            elderly.general_ledger = raw_elderly_general_ledger;
                                            elderly.subsidiary_ledger =raw_elderly_subsidiary_ledger;
                                            elderly.journal_account = raw_elderly_journal_account;
                                            yield elderly.save();
                                            break;
                                        case 2:
                                            yield app.modelFactory().model_delete(app.models['pub_tenantJournalAccount'], remove_tenantJournalAccount_B0006_id);
                                            break;
                                        case 3:
                                            yield app.modelFactory().model_delete(app.models['pub_tenantJournalAccount'], remove_tenantJournalAccount_item_id);
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
                method: 'completeExit',//完成出院
                verb: 'post',
                url: this.service_url_prefix + "/completeExit/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var steps;
                        var exit,tenant,elderly,roomStatus,now_roomOccupancyChangeHistory,new_roomOccupancyChangeHistory;
                        var raw_exit_current_step,raw_exit_exit_on,raw_exit_elderly_snapshot,
                            raw_elderly_live_in_flag, raw_elderly_begin_exit_flow,raw_elderly_room_value, raw_elderly_room_summary,raw_elderly_exit_on,
                            raw_roomStatus_occupied,raw_roomOccupancyChangeHistory_in_flag,raw_roomOccupancyChangeHistory_check_out_time;
                        var remove_roomOccupancyChangeHistory_id;
                        try {
                            exit = yield app.modelFactory().model_read(app.models["psn_exit"], this.params._id);
                            if (!exit || exit.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到出院记录!'});
                                yield next;
                                return;
                            }

                            elderly = yield app.modelFactory().model_read(app.models["psn_elderly"], exit.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人资料!'});
                                yield next;
                                return;
                            }

                            if (!elderly.live_in_flag) {
                                this.body = app.wrapper.res.error({message: '该老人已出院!'});
                                yield next;
                                return;
                            }

                            roomStatus = yield app.modelFactory().model_one(app.models["psn_roomStatus"], {
                                where: {
                                    roomId: elderly.room_value.roomId,
                                    'occupied.bed_no': elderly.room_value.bed_no,
                                    'occupied.elderlyId': elderly._id,
                                    'occupied.bed_status': 'A0003'
                                }
                            });

                            if (roomStatus == null) {
                                this.body = app.wrapper.res.error({message: '无法找到当前老人在用的床位状态资料!'});
                                yield next;
                                return;
                            }

                            var roomOccupancyChangeHistories = yield app.modelFactory().model_query(app.models['psn_roomOccupancyChangeHistory'], {
                                where: {
                                    tenantId: exit.tenantId,
                                    roomId: elderly.room_value.roomId,
                                    bed_no: elderly.room_value.bed_no,
                                    elderlyId: elderly._id,
                                    in_flag: true
                                }, sort: {check_in_time: -1}
                            });

                            if (roomOccupancyChangeHistories && roomOccupancyChangeHistories.length > 0) {
                                now_roomOccupancyChangeHistory = roomOccupancyChangeHistories[0];
                            }
                            else {
                                this.body = app.wrapper.res.error({message: '无法找到旧的房间占用历史!'});
                                yield next;
                                return;
                            }


                            var exit_json = exit.toObject();
                            var elderly_json = elderly.toObject();
                            var roomStatus_json = roomStatus.toObject();
                            console.log('前置检查完成');

                            raw_exit_current_step = exit_json.current_step;
                            raw_exit_exit_on = undefined;
                            raw_exit_elderly_snapshot = undefined;
                            raw_elderly_live_in_flag = elderly_json.live_in_flag;
                            raw_elderly_begin_exit_flow = elderly_json.begin_exit_flow;
                            raw_elderly_room_value = app.clone(elderly_json.room_value);
                            raw_elderly_room_summary = elderly_json.room_summary;
                            raw_elderly_exit_on = undefined;
                            raw_roomStatus_occupied = app.clone(roomStatus_json.occupied);
                            raw_roomOccupancyChangeHistory_in_flag = now_roomOccupancyChangeHistory.in_flag;
                            raw_roomOccupancyChangeHistory_check_out_time = undefined;


                            now_roomOccupancyChangeHistory.in_flag = true;
                            now_roomOccupancyChangeHistory.check_out_time = app.moment();

                            for (var i = 0; i < roomStatus.occupied.length; i++) {
                                var occupy = roomStatus.occupied[i];
                                if (elderly._id.equals(occupy.elderlyId) && elderly.room_value.bed_no == occupy.bed_no && occupy.bed_status == 'A0003') {
                                    console.log('update roomOccupy')
                                    occupy.bed_status = 'A0001';
                                    occupy.elderlyId = undefined;
                                }
                            }

                            exit.current_step = 'A0009';
                            exit.exit_on = app.moment();
                            exit.elderly_snapshot = {
                                charge_standard: elderly_json.charge_standard,
                                charge_items: elderly_json.charge_items,
                                journal_account: elderly_json.journal_account,
                                charge_item_change_history: elderly_json.charge_item_change_history
                            };

                            elderly.live_in_flag = false;
                            elderly.begin_exit_flow = false;
                            elderly.room_value = undefined;
                            elderly.room_summary = undefined;
                            elderly.exit_on = exit.exit_on;

                            yield now_roomOccupancyChangeHistory.save();
                            steps = "A";

                            yield roomStatus.save();
                            steps += "A";

                            yield exit.save();
                            steps += "A";

                            yield elderly.save();

                            this.body = app.wrapper.res.ret({current_step: exit.current_step, exit_on: exit.exit_on});

                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);

                            //roll back
                            if(steps){
                                for(var i=0;i<steps.length;i++) {
                                    switch(i){
                                        case 0:
                                            now_roomOccupancyChangeHistory.in_flag = raw_roomOccupancyChangeHistory_in_flag;
                                            now_roomOccupancyChangeHistory.check_out_time = raw_roomOccupancyChangeHistory_check_out_time;
                                            yield now_roomOccupancyChangeHistory.save();
                                            break;
                                        case 1:
                                            roomStatus.occupied = raw_roomStatus_occupied;
                                            yield roomStatus.save();
                                            break;
                                        case 2:
                                            exit.current_step = raw_exit_current_step;
                                            exit.exit_on = raw_exit_exit_on;
                                            exit.elderly_snapshot = raw_exit_elderly_snapshot;
                                            yield exit.save();
                                            break;
                                    }
                                }
                            }
                        }
                        yield next;
                    };
                }
            },
            /**********************接待与外出管理*****************************/
            {
                method: 'receptionVisiterSyncElderlyFamilyMembers',
                verb: 'post',
                url: this.service_url_prefix + "/receptionVisiterSyncElderlyFamilyMembers/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var reception,elderly;
                        try {
                            reception = yield app.modelFactory().model_read(app.models['psn_reception'], this.params._id);
                            if (!reception || reception.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到接待记录!'});
                                yield next;
                                return;
                            }

                            elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], reception.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                yield next;
                                return;
                            }

                            console.log('receptionVisiterSyncElderlyFamilyMembers 前置检查完成');

                            var member;
                            for(var i=0;i< elderly.family_members.length;i++) {
                                if (elderly.family_members[i].name == reception.visit_info.name) {
                                    member = elderly.family_members[i];
                                    break;
                                }
                            }

                            if(!member) {
                                elderly.family_members.push(app._.extend({}, reception.toObject().visit_info));
                            }
                            else{

                                reception.visit_info.id_no && (member.id_no = reception.visit_info.id_no);
                                reception.visit_info.sex && (member.sex = reception.visit_info.sex);
                                reception.visit_info.relation_with && (member.relation_with = reception.visit_info.relation_with);
                                reception.visit_info.phone && (member.phone = reception.visit_info.phone);
                                reception.visit_info.address && (member.address = reception.visit_info.address);
                            }

                            yield elderly.save();

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
                method: 'leaveAccompanierSyncElderlyFamilyMembers',
                verb: 'post',
                url: this.service_url_prefix + "/leaveAccompanierSyncElderlyFamilyMembers/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        var leave,elderly;
                        try {
                            leave = yield app.modelFactory().model_read(app.models['psn_leave'], this.params._id);
                            if (!leave || leave.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到外出记录!'});
                                yield next;
                                return;
                            }

                            elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], leave.elderlyId);
                            if (!elderly || elderly.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                yield next;
                                return;
                            }

                            console.log('receptionAccompanierSyncElderlyFamilyMembers 前置检查完成');


                            var member;
                            for(var i=0;i< elderly.family_members.length;i++) {
                                if (elderly.family_members[i].name == leave.accompany_info.name) {
                                    member = elderly.family_members[i];
                                    break;
                                }
                            }

                            if(!member) {
                                elderly.family_members.push(app._.extend({}, leave.toObject().accompany_info));
                            }
                            else{

                                leave.accompany_info.id_no && (member.id_no = leave.accompany_info.id_no);
                                leave.accompany_info.sex && (member.sex = leave.accompany_info.sex);
                                leave.accompany_info.relation_with && (member.relation_with = leave.accompany_info.relation_with);
                                leave.accompany_info.phone && (member.phone = leave.accompany_info.phone);
                                leave.accompany_info.address && (member.address = leave.accompany_info.address);
                            }

                            yield elderly.save();

                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            /**********************护理排班*****************************/
            {
                method: 'nursingScheduleWeekly',
                verb: 'post',
                url: this.service_url_prefix + "/nursingScheduleWeekly", //按周查找护理排班
                handler: function (app, options) {
                    return function * (next) {
                        var tenant;
                        try {
                            //this.request.body
                            var tenantId = this.request.body.tenantId;
                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }

                            var xAxisRangePoints = this.request.body.x_axis_range_points;
                            xAxisValueStart = app.moment(xAxisRangePoints.start);
                            xAxisValueEnd = app.moment(xAxisRangePoints.end);

                            console.log('xAxisRangePoints:');
                            console.log(xAxisRangePoints);

                            console.log('前置检查完成');

                            var rows = yield app.modelFactory().model_query(app.models['psn_nursingSchedule'],{
                                select: 'x_axis y_axis aggr_value',
                                where:{
                                    tenantId: tenantId,
                                    x_axis: {'$gte': xAxisValueStart.toDate(), '$lt': xAxisValueEnd.add(1, 'days').toDate()}
                                }
                            });

                            var yAxisData = app._.map(app._.uniq(app._.map(rows,(o) => {
                                return o.y_axis.toString();
                            })), (o) => {
                                return {_id: o};
                            });
                            // console.log(yAxisData);
                            // console.log(rows);
                            this.body = app.wrapper.res.ret({
                                yAxisData: yAxisData,
                                items: rows
                            });
                        }
                        catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'nursingScheduleSave',
                verb: 'post',
                url: this.service_url_prefix + "/nursingScheduleSave",
                handler: function (app, options) {
                    return function * (next) {
                        var tenant;
                        try {
                            //this.request.body
                            var tenantId = this.request.body.tenantId;
                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }

                            var toSaveRows = this.request.body.toSaveRows;
                            app._.each(toSaveRows, (o) => {
                                o.tenantId = tenantId
                            });

                            // 查找x_axis range & y_axis_range
                            var xAxisValue;
                            var xAxisRange = app._.uniq(app._.map(toSaveRows, (o) => {
                                xAxisValue = app.moment(o.x_axis);
                                return {'x_axis': {'$gte': xAxisValue.toDate(), '$lt': xAxisValue.add(1, 'days').toDate()}}
                            }));
                            var yAxisRange = app._.uniq(app._.map(toSaveRows, (o) => {
                                return o.y_axis;
                            }));

                            var removeWhere = {
                                tenantId: tenantId,
                                y_axis: {$in: yAxisRange},
                                $or: xAxisRange
                            };

                            console.log('xAxisRange:');
                            console.log(xAxisRange);
                            console.log('yAxisRange:');
                            console.log(yAxisRange);

                            console.log('前置检查完成');

                            var ret = yield app.modelFactory().model_bulkInsert(app.models['psn_nursingSchedule'],{
                                rows: toSaveRows,
                                removeWhere: removeWhere
                            });

                            console.log('排班保存成功');
                            var now = app.moment(), toSaveRow, exec_start, exec_end, nursingRecordsMatched, nursingRecordIds, batchConditions, batchModel,needUpdateNursingRecord;
                            for (var i = 0,len = toSaveRows.length;i<len;i++) {
                                toSaveRow = toSaveRows[i];
                                exec_start = app.moment(toSaveRow.x_axis);
                                exec_end = app.moment(exec_start).add(1, 'days');

                                if(now.isAfter(exec_end)) {
                                    needUpdateNursingRecord = true;
                                } else if (now.isBefore(exec_start)) {
                                    needUpdateNursingRecord = false;
                                } else {
                                    // now 与排班是在同一天,计算时间部分
                                    exec_start = now;
                                }

                                // console.log('exec_start:', exec_start.format('YYYY-MM-DD HH:mm'));
                                // console.log('exec_end:', exec_end.format('YYYY-MM-DD HH:mm'));
                                // console.log('roomId:', toSaveRow.y_axis);
                                // console.log('tenantId', toSaveRow.tenantId);

                                nursingRecordsMatched = yield app.modelFactory().model_query(app.models['psn_nursingRecord'], {
                                    select: '_id',
                                    where: {
                                        exec_on: {'$gte': exec_start, '$lt': exec_end},
                                        roomId: toSaveRow.y_axis,
                                        tenantId: toSaveRow.tenantId
                                    }
                                });

                                if (nursingRecordsMatched.length > 0) {
                                    nursingRecordIds = app._.map(nursingRecordsMatched, (o)=> {
                                        return o._id;
                                    });

                                    console.log('bulkUpdate nursingRecordIds:', nursingRecordIds);

                                    batchConditions = {"_id": {"$in": nursingRecordIds}};
                                    batchModel = {assigned_worker: toSaveRow.aggr_value};

                                    yield app.modelFactory().model_bulkUpdate(app.models['psn_nursingRecord'], {
                                        conditions: batchConditions,
                                        batchModel: batchModel
                                    });
                                }
                            }

                            this.body = app.wrapper.res.default();
                        }
                        catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'nursingScheduleRemove',
                verb: 'post',
                url: this.service_url_prefix + "/nursingScheduleRemove",
                handler: function (app, options) {
                    return function * (next) {
                        var tenant;
                        try {
                            //this.request.body
                            var tenantId = this.request.body.tenantId;
                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }

                            var toRemoveRows = this.request.body.toRemoveRows;


                            console.log('toRemoveRows:');
                            console.log(toRemoveRows);

                            var xAxisValue;
                            var xAxisRange = app._.uniq(app._.map(toRemoveRows, (o) => {
                                xAxisValue = app.moment(o.x_axis);
                                return {'x_axis': {'$gte': xAxisValue.toDate(), '$lt': xAxisValue.add(1, 'days').toDate()}}
                            }));
                            var yAxisRange = app._.uniq(app._.map(toRemoveRows, (o) => {
                                return o.y_axis;
                            }));

                            var removeWhere = {
                                tenantId: tenantId,
                                y_axis: {$in: yAxisRange},
                                $or: xAxisRange
                            };

                            console.log('前置检查完成');

                            var ret = yield app.modelFactory().model_remove(app.models['psn_nursingSchedule'], removeWhere);
                            this.body = app.wrapper.res.default();


                            console.log('排班删除成功');
                            var now = app.moment(), toRemoveRow, exec_start, exec_end, nursingRecordsMatched, nursingRecordIds, batchConditions, batchModel,needUpdateNursingRecord;
                            for (var i = 0,len = toRemoveRows.length;i<len;i++) {
                                toRemoveRow = toRemoveRows[i];
                                exec_start = app.moment(toRemoveRow.x_axis);
                                exec_end = app.moment(exec_start).add(1, 'days');

                                if(now.isAfter(exec_end)) {
                                    needUpdateNursingRecord = true;
                                } else if (now.isBefore(exec_start)) {
                                    needUpdateNursingRecord = false;
                                } else {
                                    // now 与排班是在同一天,计算时间部分
                                    exec_start = now;
                                }

                                // console.log('exec_start:', exec_start.format('YYYY-MM-DD HH:mm'));
                                // console.log('exec_end:', exec_end.format('YYYY-MM-DD HH:mm'));
                                // console.log('roomId:', toSaveRow.y_axis);
                                // console.log('tenantId', toSaveRow.tenantId);

                                nursingRecordsMatched = yield app.modelFactory().model_query(app.models['psn_nursingRecord'], {
                                    select: '_id',
                                    where: {
                                        exec_on: {'$gte': exec_start, '$lt': exec_end},
                                        roomId: toRemoveRow.y_axis,
                                        tenantId: tenantId
                                    }
                                });

                                if (nursingRecordsMatched.length > 0) {
                                    nursingRecordIds = app._.map(nursingRecordsMatched, (o)=> {
                                        return o._id;
                                    });

                                    console.log('bulkUpdate nursingRecordIds:', nursingRecordIds);

                                    batchConditions = {"_id": {"$in": nursingRecordIds}};
                                    batchModel = { $unset: {assigned_worker: 1}};

                                    yield app.modelFactory().model_bulkUpdate(app.models['psn_nursingRecord'], {
                                        conditions: batchConditions,
                                        batchModel: batchModel
                                    });
                                }
                            }
                        }
                        catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'nursingScheduleTemplateImport',
                verb: 'post',
                url: this.service_url_prefix + "/nursingScheduleTemplateImport",
                handler: function (app, options) {
                    return function * (next) {
                        var nursingScheduleTemplate;
                        try {
                            //this.request.body
                            var nursingScheduleTemplateId = this.request.body.nursingScheduleTemplateId;
                            nursingScheduleTemplate = yield app.modelFactory().model_read(app.models['psn_nursingScheduleTemplate'], nursingScheduleTemplateId);
                            if(!nursingScheduleTemplate || nursingScheduleTemplate.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到护理模版!'});
                                yield next;
                                return;
                            }

                            var toImportXAxisRange = this.request.body.toImportXAxisRange;


                            console.log('toImportXAxisRange:');
                            console.log(toImportXAxisRange);

                            var xAxisValue, xAxisDate;
                            var xAxisDayDateMap = {};
                            var xAxisRange = app._.map(toImportXAxisRange, (o) => {
                                xAxisValue = app.moment(o);
                                xAxisDate = xAxisValue.toDate();
                                xAxisDayDateMap[xAxisValue.day()] = xAxisDate;
                                return {'x_axis': {'$gte': xAxisDate, '$lt': xAxisValue.add(1, 'days').toDate()}}
                            });

                            var templateItems = nursingScheduleTemplate.content;
                            var yAxisRange = app._.uniq(app._.map(templateItems, (o) => {
                                return o.y_axis;
                            }));

                            var removeWhere = {
                                tenantId: nursingScheduleTemplate.tenantId,
                                y_axis: {$in: yAxisRange},
                                $or: xAxisRange
                            };

                            var toSaveRows = app._.map(templateItems, (o) => {
                                var x_axis = xAxisDayDateMap[o.x_axis];
                                return {x_axis: x_axis, y_axis: o.y_axis, aggr_value: o.aggr_value, tenantId: nursingScheduleTemplate.tenantId};
                            });


                            console.log('前置检查完成');

                            var ret = yield app.modelFactory().model_bulkInsert(app.models['psn_nursingSchedule'],{
                                rows: toSaveRows,
                                removeWhere: removeWhere
                            });

                            console.log('排班模版导入成功');
                            var now = app.moment(), toSaveRow, exec_start, exec_end, nursingRecordsMatched, nursingRecordIds, batchConditions, batchModel,needUpdateNursingRecord;
                            for (var i = 0,len = toSaveRows.length;i<len;i++) {
                                toSaveRow = toSaveRows[i];
                                exec_start = app.moment(toSaveRow.x_axis);
                                exec_end = app.moment(exec_start).add(1, 'days');

                                if(now.isAfter(exec_end)) {
                                    needUpdateNursingRecord = true;
                                } else if (now.isBefore(exec_start)) {
                                    needUpdateNursingRecord = false;
                                } else {
                                    // now 与排班是在同一天,计算时间部分
                                    exec_start = now;
                                }

                                // console.log('exec_start:', exec_start.format('YYYY-MM-DD HH:mm'));
                                // console.log('exec_end:', exec_end.format('YYYY-MM-DD HH:mm'));
                                // console.log('roomId:', toSaveRow.y_axis);
                                // console.log('tenantId', toSaveRow.tenantId);

                                nursingRecordsMatched = yield app.modelFactory().model_query(app.models['psn_nursingRecord'], {
                                    select: '_id',
                                    where: {
                                        exec_on: {'$gte': exec_start, '$lt': exec_end},
                                        roomId: toSaveRow.y_axis,
                                        tenantId: toSaveRow.tenantId
                                    }
                                });

                                if (nursingRecordsMatched.length > 0) {
                                    nursingRecordIds = app._.map(nursingRecordsMatched, (o)=> {
                                        return o._id;
                                    });

                                    console.log('bulkUpdate nursingRecordIds:', nursingRecordIds);

                                    batchConditions = {"_id": {"$in": nursingRecordIds}};
                                    batchModel = {assigned_worker: toSaveRow.aggr_value};

                                    yield app.modelFactory().model_bulkUpdate(app.models['psn_nursingRecord'], {
                                        conditions: batchConditions,
                                        batchModel: batchModel
                                    });
                                }
                            }

                            this.body = app.wrapper.res.default();
                        }
                        catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'nursingScheduleSaveAsTemplateWeekly',
                verb: 'post',
                url: this.service_url_prefix + "/nursingScheduleSaveAsTemplateWeekly",
                handler: function (app, options) {
                    return function * (next) {
                        var tenant;
                        try {
                            //this.request.body
                            var tenantId = this.request.body.tenantId;
                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }

                            var nursingScheduleTemplateName = this.request.body.nursingScheduleTemplateName;
                            var toSaveRows = this.request.body.toSaveRows;
                            app._.each(toSaveRows, (o) => {
                                o.tenantId = tenantId
                            });

                            var nursingScheduleTemplate = yield app.modelFactory().model_one(app.models['psn_nursingScheduleTemplate'], {
                                where: {
                                    status: 1,
                                    name: nursingScheduleTemplateName,
                                    type: DIC.D3010.WEEKLY,
                                    tenantId: tenantId
                                }
                            });

                            console.log('前置检查完成');
                            var isCreate = !nursingScheduleTemplate;
                            if (isCreate) {
                                yield app.modelFactory().model_create(app.models['psn_nursingScheduleTemplate'],{
                                    name: nursingScheduleTemplateName,
                                    type: DIC.D3010.WEEKLY,
                                    content: toSaveRows,
                                    tenantId: tenantId
                                });
                            } else {
                                nursingScheduleTemplate.content = toSaveRows;
                                yield nursingScheduleTemplate.save();
                            }

                            this.body = app.wrapper.res.ret(isCreate);
                        }
                        catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            /**********************护理计划*****************************/
            {
                method: 'nursingPlansByRoom',
                verb: 'post',
                url: this.service_url_prefix + "/nursingPlansByRoom", //按房间查找入住老人的护理计划
                handler: function (app, options) {
                    return function * (next) {
                        var tenant, elderly, nursingPlan;
                        try {
                            var tenantId = this.request.body.tenantId;
                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }

                            var elderlySelectArray = this.request.body.elderlySelectArray;
                            if(elderlySelectArray.indexOf('room_value') == -1) {
                                elderlySelectArray.push('room_value');
                            }
                            var nursingPlanSelectArray = this.request.body.nursingPlanSelectArray;

                            var rooms = yield app.modelFactory().model_query(app.models['psn_room'],{
                                select: 'name capacity',
                                where: {
                                    status: 1,
                                    tenantId: tenantId
                                }
                            });

                            var elderlys = yield app.modelFactory().model_query(app.models['psn_elderly'],{
                                select: elderlySelectArray.join(' '),
                                where: {
                                    status: 1,
                                    live_in_flag: true,
                                    tenantId: tenantId
                                }
                            });


                            var nursingPlans = yield app.modelFactory().model_query(app.models['psn_nursingPlan'],{
                                select: nursingPlanSelectArray.join(' '),
                                where: {
                                    status: 1,
                                    tenantId: tenantId
                                }
                            });

                            var nursingPlansByRoom = {};
                            app._.each(rooms, function (o) {
                                for (var i = 1, len = o.capacity; i <= len; i++) {
                                    elderly = app._.find(elderlys, (o2) => {
                                        return o2.room_value.roomId.toString() == o._id.toString() && o2.room_value.bed_no == i;
                                    });

                                    if (elderly) {
                                        nursingPlan = app._.find(nursingPlans, (o3) => {
                                            return o3.elderlyId.toString() == elderly._id.toString();
                                        });
                                    }

                                    nursingPlansByRoom[o._id + '$' + i] = {
                                        roomId: o._id,
                                        room_name: o.name,
                                        bed_no: i,
                                        elderly: elderly || {},
                                        nursing_plan: nursingPlan || {}
                                    };
                                }
                            });

                            this.body = app.wrapper.res.ret(nursingPlansByRoom);
                        }
                        catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'nursingPlanSaveWorkItem',
                verb: 'post',
                url: this.service_url_prefix + "/nursingPlanSaveWorkItem", //为老人保存一条护理类目
                handler: function (app, options) {
                    return function * (next) {
                        var tenant, elderly, workItem, nursingPlan;
                        try {
                            var tenantId = this.request.body.tenantId;
                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }

                            var elderlyId = this.request.body.elderlyId;
                            elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], elderlyId);
                            if(!elderly || elderly.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                yield next;
                                return;
                            }

                            var workItemCheckInfo = this.request.body.work_item_check_info;
                            var toProcessWorkItemId = workItemCheckInfo.id;
                            workItem = yield app.modelFactory().model_read(app.models['psn_workItem'], toProcessWorkItemId);
                            if(!workItem || workItem.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到工作项目!'});
                                yield next;
                                return;
                            }

                            var toProcessWorkItem = workItem.toObject();
                            toProcessWorkItem.workItemId = toProcessWorkItemId;

                            var isRemoved = !workItemCheckInfo.checked;


                            var elderlyNursingPlan = yield app.modelFactory().model_one(app.models['psn_nursingPlan'],{
                                select: 'work_items',
                                where: {
                                    status: 1,
                                    elderlyId: elderlyId,
                                    tenantId: tenantId
                                }
                            });



                            if (!elderlyNursingPlan) {
                                if (!isRemoved) {

                                    yield app.modelFactory().model_create(app.models['psn_nursingPlan'],{
                                        elderlyId: elderlyId,
                                        elderly_name: elderly.name,
                                        work_items: [toProcessWorkItem],
                                        tenantId: elderly.tenantId
                                    });
                                }
                            } else {
                                var workItems = elderlyNursingPlan.work_items;
                                var index = app._.findIndex(workItems, (o) => {
                                    return o.workItemId.toString() == toProcessWorkItemId;
                                });
                                if (!isRemoved) {
                                    // 加入
                                    if (index == -1) {
                                        workItems.push(toProcessWorkItem);
                                    }
                                } else {
                                    if (index != -1) {
                                        workItems.splice(index, 1);
                                    }
                                }

                                elderlyNursingPlan.work_items = workItems;

                                yield elderlyNursingPlan.save();
                            }

                            this.body = app.wrapper.res.default();
                        }
                        catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'nursingPlanSaveRemark',
                verb: 'post',
                url: this.service_url_prefix + "/nursingPlanSaveRemark", //为老人保存一条护理项目
                handler: function (app, options) {
                    return function * (next) {
                        var tenant, elderly, nursingPlan;
                        try {
                            var tenantId = this.request.body.tenantId;
                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }

                            var elderlyId = this.request.body.elderlyId;
                            elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], elderlyId);
                            if(!elderly || elderly.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                yield next;
                                return;
                            }

                            var remark = this.request.body.remark;  
                            var elderlyNursingPlan = yield app.modelFactory().model_one(app.models['psn_nursingPlan'],{
                                select: 'remark',
                                where: {
                                    status: 1,
                                    elderlyId: elderlyId,
                                    tenantId: tenantId
                                }
                            });

                            if (!elderlyNursingPlan) {
                                yield app.modelFactory().model_create(app.models['psn_nursingPlan'],{
                                    elderlyId: elderlyId,
                                    elderly_name: elderly.name,
                                    remark: remark,
                                    tenantId: elderly.tenantId
                                });
                            } else {
                                 
                                elderlyNursingPlan.remark = remark;

                                yield elderlyNursingPlan.save();
                            }

                            this.body = app.wrapper.res.default();
                        }
                        catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            /**********************护理计划执行(护理记录)*****************************/
            {
                method: 'nursingRecordGenerate',
                verb: 'post',
                url: this.service_url_prefix + "/nursingRecordGenerate", //按照护理计划一轮护理记录
                handler: function (app, options) {
                    return function * (next) {
                        var tenant, elderly, elderlyRoomValue, roomId, nursingPlanItems, nursingPlanItem, workItems, workItem,
                            nursingRecord, now, gen_batch_no, nursingWorkerScheduleItem, exec_date, exec_on, exec_date_string, remind_on;
                        var elderlyMapRoom = {},  nursingRecordsToSave = [], nursingRecordToSave,work_item_repeat_values, allEdlerlyIds, allElderly, nursingRecordExist,
                            remind_max, remind_step, remind_start, exec_start, exec_end, warningMsg;
                        try {
                            var tenantId = this.request.body.tenantId;
                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }

                            var elderlyId = this.request.body.elderlyId;
                            if (elderlyId) {
                                // 为单个老人
                                elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], elderlyId);
                                if (!elderly || elderly.status == 0) {
                                    this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                    yield next;
                                    return;
                                }

                                if (!elderly.live_in_flag) {
                                    this.body = app.wrapper.res.error({message: '老人已出院或离世!'});
                                    yield next;
                                    return;
                                }

                                nursingPlanItems = yield app.modelFactory().model_query(app.models['psn_nursingPlan'], {
                                    select: 'elderlyId elderly_name work_items',
                                    where: {
                                        status: 1,
                                        elderlyId: elderlyId,
                                        tenantId: tenantId
                                    }
                                });

                                // 查询房间号
                                elderlyMapRoom[elderlyId] =  elderly.room_value;

                            } else {
                                allElderly =  yield app.modelFactory().model_query(app.models['psn_elderly'], {
                                    select: 'room_value',
                                    where: {
                                        status: 1,
                                        live_in_flag: true,
                                        tenantId: tenantId
                                    }
                                });
                                
                                app._.each(allElderly, (o) => {
                                    elderlyMapRoom[o._id.toString()] = o.room_value;
                                });

                                // 为所有老人
                                nursingPlanItems = yield app.modelFactory().model_query(app.models['psn_nursingPlan'], {
                                    select: 'elderlyId elderly_name work_items',
                                    where: {
                                        status: 1,
                                        tenantId: tenantId
                                    }
                                });
                            }

                            if (nursingPlanItems.length) {
                                now = app.moment();
                                gen_batch_no = yield app.sequenceFactory.getSequenceVal(app.modelVariables.SEQUENCE_DEFS.CODE_OF_NURSING_RECORD);
                                for (var i = 0, len = nursingPlanItems.length; i < len; i++) {
                                    nursingPlanItem = nursingPlanItems[i];
                                    elderlyRoomValue = elderlyMapRoom[nursingPlanItem.elderlyId];
                                    console.log(nursingPlanItem.elderlyId);
                                    nursingRecord = {
                                        elderlyId: nursingPlanItem.elderlyId,
                                        elderly_name: nursingPlanItem.elderly_name,
                                        roomId: elderlyRoomValue.roomId,
                                        bed_no: elderlyRoomValue.bed_no,
                                        gen_batch_no: gen_batch_no,
                                        tenantId: tenantId
                                    }
                                    workItems = nursingPlanItem.work_items;
                                    for (var j = 0, len2 = workItems.length; j < len2; j++) {
                                        workItem = workItems[j];
                                        console.log('workItem: ',workItem.name);
                                        remind_max = workItem.remind_times || 1;
                                        remind_step = workItem.duration / remind_max;
                                        console.log('remind_max: ',remind_max);
                                        console.log('remind_step: ',remind_step);

                                        nursingRecord.workItemId = workItem._id
                                        nursingRecord.name = workItem.name;
                                        nursingRecord.description = workItem.description;
                                        nursingRecord.remark = workItem.remark;
                                        nursingRecord.duration = workItem.duration;
                                        nursingRecord.remind_on = [];

                                        if (workItem.repeat_type == DIC.D0103.AS_NEEDED) {
                                            //按需工作不需要提醒
                                            nursingRecord.exec_on = app.moment(now.format('YYYY-MM-DD'));
                                            nursingRecord.assigned_worker = null; // 待补
                                            nursingRecordsToSave.push(app._.extend({}, nursingRecord));
                                        } else if (workItem.repeat_type == DIC.D0103.TIME_IN_DAY) {
                                            exec_date_string = now.format('YYYY-MM-DD');
                                            if (workItem.repeat_values.length > 0) {
                                                // 每天某几个时刻执行,考虑到时间间隔比较近,因此将当天的全部生成
                                                app._.each(workItem.repeat_values, (o)=> {
                                                    console.log(o);
                                                    nursingRecord.remind_on = [];
                                                    exec_on = app.moment(exec_date_string + ' ' + o + workItem.repeat_start);
                                                    if (exec_on.isAfter(now)) {
                                                        // 当天没有过期的时刻
                                                        nursingRecord.exec_on = exec_on;
                                                        if (workItem.remind_flag) {
                                                            remind_start = app.moment(exec_on);

                                                            for (var remind_count = 0; remind_count < remind_max; remind_count++) {

                                                                nursingRecord.remind_on.push(app.moment(remind_start.add(remind_step * remind_count, 'minutes')));
                                                            }
                                                        }
                                                        nursingRecordsToSave.push(app._.extend({}, nursingRecord));
                                                    }
                                                });
                                            } else {
                                                // 每天某个时刻执行
                                                exec_on = app.moment(exec_date_string + ' ' + workItem.repeat_start)
                                                if (exec_on.isBefore(now)) {
                                                    // 当天已经过期,生成明天
                                                    exec_on = app.moment(now).add(1, 'days').format('YYYY-MM-DD') + ' ' + workItem.repeat_start;
                                                }
                                                console.log('exec_on:', exec_on.format('YYYY-DD-MM HH:mm'));
                                                nursingRecord.exec_on = exec_on;
                                                if (workItem.remind_flag) {
                                                    remind_start = app.moment(exec_on);
                                                    for (var remind_count = 0; remind_count < remind_max; remind_count++) {
                                                        // console.log('remind_start:', remind_start.format('YYYY-DD-MM HH:mm'));
                                                        // console.log('remind_count:', remind_count);
                                                        // console.log('remind_step:', remind_step);
                                                        nursingRecord.remind_on.push(app.moment(remind_start.add(remind_step * remind_count, 'minutes')));
                                                    }
                                                }
                                                nursingRecordsToSave.push(app._.extend({}, nursingRecord));
                                            }
                                        } else if (workItem.repeat_type == DIC.D0103.DAY_IN_WEEK) {
                                            if (workItem.repeat_values) {
                                                work_item_repeat_values = workItem.repeat_values;
                                                for (var weekDay = now.day(),weekMax = weekDay+8; weekDay< weekMax; weekDay++) {
                                                    if (app._.find(work_item_repeat_values, (o) => {
                                                            return weekDay % 7 === o % 7;
                                                        })) {
                                                        // day 相等以后,判断是否时是生成当天,如果是则比较时刻,时刻过期的话需要生成下一个执行点
                                                        exec_date = now.day(weekDay);
                                                        if (app.moment(exec_date.format('YYYY-MM-DD') + ' ' + workItem.repeat_start).isAfter(now)) {
                                                            exec_on = app.moment(exec_date.format('YYYY-MM-DD') + ' ' + workItem.repeat_start)
                                                            if (workItem.remind_flag) {
                                                                remind_start = app.moment(exec_on);
                                                                for (var remind_count = 0; remind_count < remind_max; remind_count++) {
                                                                    nursingRecord.remind_on.push(app.moment(remind_start.add(remind_step * remind_count, 'minutes')));
                                                                }
                                                            }
                                                            nursingRecordsToSave.push(app._.extend({}, nursingRecord));
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        } else if (workItem.repeat_type == DIC.D0103.DATE_IN_MONTH) {
                                            if (workItem.repeat_values) {
                                                work_item_repeat_values = workItem.repeat_values;
                                                for (var i = 0; i< 32;i++) {
                                                    if (app._.find(work_item_repeat_values, (o) => {
                                                            return app.moment(now).add(i, 'danursingRecordToSaveys').date() === o;
                                                        })) {
                                                        // date 相等以后,判断是否时是生成当天,如果是则比较时刻,时刻过期的话需要生成下一个执行点
                                                        exec_date = app.moment(now).add(i, 'days');
                                                        if (app.moment(exec_date.format('YYYY-MM-DD') + ' ' + workItem.repeat_start).isAfter(now)) {
                                                            exec_on = app.moment(exec_date.format('YYYY-MM-DD') + ' ' + workItem.repeat_start)
                                                            if (workItem.remind_flag) {
                                                                remind_start = app.moment(exec_on);
                                                                for (var remind_count = 0; remind_count < remind_max; remind_count++) {
                                                                    nursingRecord.remind_on.push(app.moment(remind_start.add(remind_step * remind_count, 'minutes')));
                                                                }
                                                            }
                                                            nursingRecordsToSave.push(app._.extend({}, nursingRecord));
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                console.log('nursingRecordsToSave:',nursingRecordsToSave);
                                for (var i=0, findNuringWorkerCount=0, len = nursingRecordsToSave.length;i<len;i++) {
                                    nursingRecordToSave = nursingRecordsToSave[i];
                                    elderlyRoomValue = elderlyMapRoom[nursingRecordToSave.elderlyId];
                                    // 查找老人对应的护工 (老人->房间+日期->排班->护工)
                                    exec_start = app.moment(nursingRecordToSave.exec_on.format('YYYY-MM-DD'));
                                    exec_end = app.moment(exec_start).add(1, 'days');
                                    // console.log('exec_start:', exec_start.format('YYYY-MM-DD HH:mm'));
                                    // console.log('exec_end:', exec_end.format('YYYY-MM-DD HH:mm'));
                                    // console.log('elderlyRoomValue:', elderlyRoomValue);
                                    nursingWorkerScheduleItem = yield app.modelFactory().model_one(app.models['psn_nursingSchedule'], {
                                        select: 'aggr_value',
                                        where: {
                                            status: 1,
                                            x_axis: {'$gte': exec_start, '$lt': exec_end},
                                            y_axis: elderlyRoomValue.roomId,
                                            tenantId: tenantId
                                        }
                                    });
                                    if (nursingWorkerScheduleItem) {
                                        nursingRecordToSave.assigned_worker = nursingWorkerScheduleItem.aggr_value;
                                        findNuringWorkerCount++;
                                    }
                                }
                                if (findNuringWorkerCount == 0) {
                                    warningMsg = '无法找到护理记录执行时间对应的护工,可能还没有排班';
                                } else if(findNuringWorkerCount < len) {
                                    warningMsg = '部分护理记录无法找到执行时间对应的护工,可能那些时间段还没有排班';
                                }

                                // 最终需要先删除当前时间之后的所有记录,并插入重新计算以后的护理记录
                                if (nursingRecordsToSave.length > 0) {
                                    allEdlerlyIds = app._.allKeys(elderlyMapRoom);
                                    yield app.modelFactory().model_bulkInsert(app.models['psn_nursingRecord'], {
                                        removeWhere: {
                                            status: 1,
                                            tenantId: tenantId,
                                            elderlyId: {'$in': allEdlerlyIds},
                                            exec_on: {'$gt': now},

                                        },
                                        rows: nursingRecordsToSave
                                    });
                                }
                            }

                            this.body = app.wrapper.res.default(warningMsg);
                        }
                        catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
 

            /**********************药品相关*****************************/
            {
                method: 'queryDrug',
                verb: 'post',
                url: this.service_url_prefix + "/q/drug",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenantId = this.request.body.tenantId;
                            var keyword = this.request.body.keyword;
                            var data = this.request.body.data;

                            app._.extend(data.where,{
                                status: 1,
                                tenantId: tenantId
                            });

                            if(keyword){
                                data.where.full_name = new RegExp(keyword);
                            }
                            var rows = yield app.modelFactory().model_query(app.models['psn_drugDirectory'], data);
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

            /**********************护士台*****************************/
            {
                method: 'elderlysByDistrictFloors',
                verb: 'post',
                url: this.service_url_prefix + "/elderlysByDistrictFloors", //按片区楼层查找入住老人
                handler: function (app, options) {
                    return function * (next) {
                        var tenant, districtFloors, pairOfDistrictFloor, roomObjects, roomIds, elderlyObjects, elderlyIds;
                        try {
                            var tenantId = this.request.body.tenantId;
                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }

                            // console.log('districtFloors:', this.request.body.districtFloors);
                            var districtFloors = app._.map(this.request.body.districtFloors, (o) => {
                                pairOfDistrictFloor = o.split('$');
                                return {'$and':[{districtId: pairOfDistrictFloor[0]},{floor: pairOfDistrictFloor[1]}]};
                            });

                            // console.log('districtFloors:', districtFloors);
                            roomObjects = yield app.modelFactory().model_query(app.models['psn_room'], {
                                select: '_id',
                                where: {
                                    status: 1,
                                    '$or': districtFloors,
                                    tenantId: tenantId
                                }
                            });

                            roomIds = app._.map(roomObjects, (o) => {
                               return o._id;
                            });
                            // console.log('roomIds:', roomIds);
                            elderlyObjects = yield app.modelFactory().model_query(app.models['psn_roomOccupancyChangeHistory'], {
                                select: 'elderlyId',
                                where: {
                                    roomId: {'$in': roomIds},
                                    in_flag: true,
                                    check_out_time: {$exists: false},
                                    tenantId: tenantId
                                }
                            });
                            // console.log('elderlyObjects:', elderlyObjects);
                            elderlyIds =  app._.map(elderlyObjects, (o) => {
                                return o.elderlyId;
                            });
                            // console.log('elderlyIds:', elderlyIds);

                            var rows = yield app.modelFactory().model_query(app.models['psn_elderly'],{
                                select: 'name birthday nursingLevelId room_value',
                                where: {
                                    status: 1,
                                    live_in_flag: true,
                                    _id: {'$in': elderlyIds},
                                    tenantId: tenantId
                                }
                            }).populate('nursingLevelId','short_name nursing_assessment_grade', 'psn_nursingLevel')
                                .populate('room_value.roomId','name bedMonitors', 'psn_room');

                            // console.log('elderlys:', rows);

                            this.body = app.wrapper.res.rows(rows);
                        }
                        catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            /**********************出入库*****************************/
            {
                method: 'inStock',
                verb: 'post',
                url: this.service_url_prefix + "/inStock", 
                handler: function (app, options) {
                    return function * (next) {
                        var tenant, elderly, drug;
                        try {
                            var tenantId = this.request.body.tenantId;
                            var elderlyId = this.request.body.elderlyId;
                            var elderly_name = this.request.body.elderly_name;

                            var drugId = this.request.body.drugId;
                            var drug_no = this.request.body.drug_no;
                            var drug_full_name = this.request.body.drug_full_name; 
                            var in_out_quantity = this.request.body.in_out_quantity;
                            var unit = this.request.body.unit;
                            var type = this.request.body.type;
                            var drugStock  = yield app.modelFactory().model_one(app.models['psn_drugStock'],{
                                    where: {
                                        status: 1,
                                        elderlyId: elderlyId,
                                        drugId: drugId,
                                        tenantId: tenantId
                                    }
                                });
                              
                                 
                            if(!drugStock){
                                yield app.modelFactory().model_create(app.models['psn_drugStock'],{
                                    status:1,
                                    elderlyId: elderlyId,

                                    elderly_name:elderly_name,
                                    tenantId: tenantId,
                                    drugId: drugId,
                                    drug_no: drug_no,
                                    drug_full_name:drug_full_name,

                                    current_quantity: in_out_quantity,
                                    type:type,
                                    unit: unit
                                });
                            }else{
                                console.log(parseInt(drugStock.current_quantity));
                                console.log(parseInt(in_out_quantity));
                                drugStock.current_quantity = parseInt(drugStock.current_quantity) + parseInt(in_out_quantity); 
                                yield drugStock.save();
                            }
                            this.body = app.wrapper.res.default();
                        }
                        catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'outStock',
                verb: 'post',
                url: this.service_url_prefix + "/outStock", 
                handler: function (app, options) {
                    return function * (next) {
                        var tenant, elderly, drug;
                        try {
                            var tenantId = this.request.body.tenantId;
                            tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], tenantId);
                            if(!tenant || tenant.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到养老机构!'});
                                yield next;
                                return;
                            }

                            var elderlyId = this.request.body.elderlyId;
                            elderly = yield app.modelFactory().model_read(app.models['psn_elderly'], elderlyId);
                            if(!elderly || elderly.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到老人!'});
                                yield next;
                                return;
                            }
                            var elderly_json = elderly.toObject();
                            var drugId = this.request.body.drugId;
                            drug = yield app.modelFactory().model_read(app.models['psn_drugDirectory'],drugId);
                            if(!drug || drug.status == 0){
                                this.body = app.wrapper.res.error({message: '无法找到药品!'});
                                yield next;
                                return;
                            }
                            var drug_json = drug.toObject();
                            var in_out_quantity = this.request.body.in_out_quantity;
                            var unit = this.request.body.unit;
                            var type = this.request.body.type;
                            // yield app.modelFactory().model_create(app.models['psn_drugInOutStock'],{
                            //     elderlyId: elderlyId,
                            //     elderly_name:elderly_json.name,
                            //     tenantId: tenantId,
                            //     drugId: drugId,
                            //     drug_no: drug_json.drug_no,
                            //     drug_full_name: drug_json.full_name,
                            //     in_out_quantity: in_out_quantity,
                            //     unit: unit,
                            //     type: type,
                            //     in_out_no: 'out-'+ app.moment().format('YYYY-MM-DD HH:mm:ss')
                            // });
                            var drugStock  = yield app.modelFactory().model_one(app.models['psn_drugStock'],{
                                    where: {
                                        status: 1,
                                        elderlyId: elderlyId,
                                        drugId: drugId,
                                        tenantId: tenantId
                                    }
                                });
                           
                            if(!drugStock){
                                this.body = app.wrapper.res.error({message: '当前无库存，无法出库!'});
                                yield next;
                                return;
                            }else{
                                if(drugStock.current_quantity < in_out_quantity){
                                    this.body = app.wrapper.res.error({message: '出库数量大于当前库存，无法出库!'});
                                    yield next;
                                    return;
                                }else{
                                    yield app.modelFactory().model_create(app.models['psn_drugInOutStock'],{
                                        elderlyId: elderlyId,
                                        elderly_name:elderly_json.name,
                                        tenantId: tenantId,
                                        drugId: drugId,
                                        drug_no: drug_json.drug_no,
                                        drug_full_name: drug_json.full_name,
                                        in_out_quantity: in_out_quantity,
                                        unit: unit,
                                        type: type,
                                        in_out_type:0,
                                        in_out_no: 'OUT-'+ new Date().valueOf()
                                    });
                                    drugStock.current_quantity = parseInt(drugStock.current_quantity) - parseInt(in_out_quantity);
                                    yield drugStock.save();
                                }
                                
                            }
                            this.body = app.wrapper.res.default();
                        }
                        catch (e) {
                            console.log(e);
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            }
            /**********************其他*****************************/
            
        ];

        return this;
    }
}.init();
//.init(option);