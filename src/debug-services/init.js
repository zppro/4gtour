/**
 * init Created by zppro on 16-8-29.
 * Target:初始化基本数据
 */

var crypto = require('crypto');

module.exports = {
    init: function (option) {
        var self = this;
        this.file = __filename;
        this.filename = this.file.substr(this.file.lastIndexOf('/') + 1);
        this.module_name = this.filename.substr(0, this.filename.lastIndexOf('.'));
        this.service_url_prefix = '/debug-services/' + this.module_name.split('_').join('/');
        this.log_name = 'dsvc_' + this.filename;
        option = option || {};

        this.logger = require('log4js').getLogger(this.log_name);

        if (!this.logger) {
            console.error('logger not loaded in ' + this.file);
        }
        else {
            this.logger.info(this.file + " loaded!");
        }

        //_[action]_格式的算是初始化步骤的action，禁止删除
        this.actions = [
            {
                method: 'head',
                verb: 'get',
                url: this.service_url_prefix + "/head",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            this.body = 'ok';
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: '_initSystem_',
                verb: 'post',
                url: this.service_url_prefix + "/_initSystem_",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            //添加基本的超管用户root
                            //检查pub_user中是否存在root
                            var count = (yield app.modelFactory().model_totals(app.models['pub_user'], {code: 'root'})).length;
                            if (count == 0) {
                                yield app.modelFactory().model_create(app.models['pub_user'], {
                                    code: 'root@local',
                                    name: 'root',
                                    phone: '13623366688',
                                    type: 'A0001',
                                    roles: ['4096'],
                                    system_flag: true,
                                    password_hash: crypto.createHash('md5').update('123@abc').digest('hex')
                                });
                            }

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
                method: 'initTenantBIZData',
                verb: 'post',
                url: this.service_url_prefix + "/initTenantBIZData/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], this.params._id);
                            if (!tenant || tenant.status == 0) {
                                this.body = app.wrapper.res.error({message: '无法找到租户资料!'});
                                yield next;
                                return;
                            }

                            tenant.general_ledger = 0;
                            tenant.subsidiary_ledger && (tenant.subsidiary_ledger.self = tenant.subsidiary_ledger.other = 0);

                            yield tenant.save();

                            yield app.modelFactory().model_bulkDelete(app.models['pub_tenantJournalAccount'], {tenantId: this.params._id});

                            yield app.modelFactory().model_bulkDelete(app.models['pub_elderly'], {tenantId: tenant._id});

                            yield app.modelFactory().model_bulkDelete(app.models['pfta_roomStatus'], {tenantId: tenant._id});

                            yield app.modelFactory().model_bulkDelete(app.models['pfta_roomOccupancyChangeHistory'], {tenantId: tenant._id});

                            yield app.modelFactory().model_bulkDelete(app.models['pub_recharge'], {tenantId: tenant._id});

                            yield app.modelFactory().model_bulkDelete(app.models['pfta_exit'], {tenantId: tenant._id});

                            yield app.modelFactory().model_bulkDelete(app.models['pfta_enter'], {tenantId: tenant._id});


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
