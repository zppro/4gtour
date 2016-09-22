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
                method: 'tenantInfo',
                verb: 'get',
                url: this.service_url_prefix + "/tenantInfo/:_id/:select",//:select需要提取的字段域用逗号分割 e.g. name,type
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var tenant = yield app.modelFactory().model_read(app.models['pub_tenant'],  this.params._id);
                            var ret = app._.pick(tenant.toObject(),this.params.select.split(','));
                            this.body = app.wrapper.res.ret(ret);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            /**********************订单相关*****************************/
            {
                method: 'completeOrder',//完成订单
                verb: 'post',
                url: this.service_url_prefix + "/completeOrder/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            //1、订单状态从[财务确认收款]到[交易成功]
                            var orderUpdateData = {order_status: 'A1004', success_on: app.moment()};
                            var ret = yield app.modelFactory().model_update(app.models['pub_order'], this.params._id, orderUpdateData);
                            //2、更新tenant.open_funcs中对应的func.payed和expired_on
                            var order = yield app.modelFactory().model_read(app.models['pub_order'], this.params._id);
                            var tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], order.tenantId);

                            var order_items = order.order_items;
                            for (var i = 0; i < order_items.length; i++) {
                                var open_func = app._.findWhere(tenant.open_funcs, {func_id: order_items[i].func_id});

                                if(open_func){
                                    //已经存在的功能
                                    var isAfter = app.moment().isAfter(open_func.expired_on);
                                    if (isAfter) {
                                        //已经过期
                                        console.log('isAfter:true');
                                        open_func.expired_on = app.moment().add(order.duration, 'M');
                                    }
                                    else {
                                        //还未过期
                                        console.log('isAfter:false');
                                        open_func.expired_on = app.moment(open_func.expired_on).add(order.duration, 'M');
                                    }
                                }
                                else{
                                    //增加新功能

                                    open_func = app._.omit(order_items[i].toObject(),['_id','check_in_time']);
                                    console.log(order_items[i]);
                                    console.log(open_func);
                                    open_func.expired_on = app.moment().add(order.duration, 'M');


                                    tenant.open_funcs.push(open_func);
                                    //console.log(open_func);
                                    //console.log(tenant.open_funcs);
                                }

                            }
                            yield tenant.save();
                            this.body = app.wrapper.res.ret(orderUpdateData);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            {
                method: 'refundOrder',//订单发起退款
                verb: 'post',
                url: this.service_url_prefix + "/refundOrder/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            //1、订单状态从[交易成功]到[等待退款]
                            var orderUpdateData = {order_status: 'A1006', refund_on: app.moment()};
                            var ret = yield app.modelFactory().model_update(app.models['pub_order'],this.params._id, orderUpdateData);
                            //2、更新tenant.open_funcs中对应的func.payed和expired_on
                            var order = yield app.modelFactory().model_read(app.models['pub_order'], this.params._id);
                            var tenant = yield app.modelFactory().model_read(app.models['pub_tenant'], order.tenantId);

                            var order_items = order.order_items;
                            for (var i = 0; i < order_items.length; i++) {
                                var open_func = app._.findWhere(tenant.open_funcs, {func_id: order_items[i].func_id});
                                open_func.expired_on = app.moment(open_func.expired_on).subtract(order.duration, 'M');
                            }
                            yield tenant.save();
                            this.body = app.wrapper.res.ret(orderUpdateData);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
            /**********************用户密码相关*****************************/
            {
                method: 'userChangePassword',//用户修改密码
                verb: 'post',
                url: this.service_url_prefix + "/userChangePassword/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {

                            var user = yield app.modelFactory().model_read(app.models['pub_user'], this.params._id);
                            if(!user){
                                this.body = app.wrapper.res.error({message: '无效的用户!'});
                                yield next;
                                return;
                            }
                            var oldPasswordHash = app.crypto.createHash('md5').update(this.request.body.old_password).digest('hex');
                            if(user.password_hash != oldPasswordHash) {
                                this.body = app.wrapper.res.error({message: '旧密码错误!'});
                                yield next;
                                return;
                            }

                            var newPasswordHash = app.crypto.createHash('md5').update(this.request.body.new_password).digest('hex');
                            user.password_hash = newPasswordHash;
                            user.save();
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
                method: 'resetUserPassword',//管理中心重设用户密码
                verb: 'post',
                url: this.service_url_prefix + "/resetUserPassword/:_id",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            var user = yield app.modelFactory().model_read(app.models['pub_user'], this.params._id);
                            if(!user){
                                this.body = app.wrapper.res.error({message: '无效的用户!'});
                                yield next;
                                return;
                            }
                            console.log('before update');
                            var newPasswordHash = app.crypto.createHash('md5').update('123456').digest('hex');
                            console.log(newPasswordHash);
                            user.password_hash = newPasswordHash;
                            user.save();
                            this.body = app.wrapper.res.default();
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            }
            /*************************************************************/

        ];

        return this;
    }
}.init();
//.init(option);