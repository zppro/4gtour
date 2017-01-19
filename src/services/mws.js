/**
 * idt Created by zppro on 17-1-16.
 * 网上商城web接口
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
            {
                method: 'ship',
                verb: 'post',
                url: this.service_url_prefix + "/ship/:orderId",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            var shipInfo = app._.extend({
                                order_status: DIC.MWS01.SHIPPING,
                                logistics_time: app.moment()
                            }, this.request.body);
                            //console.log(shipInfo);
                            var updated = yield app.modelFactory().model_update(app.models['mws_order'], this.params.orderId, shipInfo);
                            // var order = yield app.modelFactory().model_read(app.models['mws_order'], this.params.orderId);
                            //
                            // var bizScene = yield app.modelFactory().model_one(app.models['mws_wxTemplateMessageKeyStore'], {where: {use_flag: false, open_id: order.open_id, tenantId: order.tenantId}});
                            // if(bizScene) {
                            //     //发送模版消息-订单发货提醒
                            //     var templateKey = 'OrderShipped';
                            //     var configs = yield app.modelFactory().model_query(app.models['mws_wxAppConfig'], {
                            //             where: {
                            //                 status: 1,
                            //                 tenantId: order.tenantId,
                            //                 templates: {$elemMatch: {"key": templateKey}}
                            //             }
                            //         },
                            //         {limit: 1});
                            //
                            //     if (configs.length == 1) {
                            //         var config = configs[0];
                            //         var template = app._.find(config.templates, (o) => {
                            //           return o.key =  templateKey
                            //         });
                            //
                            //         if (template && template.wx_template_id) {
                            //             // 调用组件app_weixin发送模版消息
                            //             var sendData = {
                            //                 "touser": bizScene.open_id,
                            //                 "template_id" : template.wx_template_id,
                            //                 "page": '/pages/store/order-details?orderId=' + order.id,
                            //                 "form_id": bizScene.scene_id,
                            //                 "data": {
                            //                     "keyword1": {
                            //                         "value": order.code,
                            //                         "color": "#173177"
                            //                     },
                            //                     "keyword2": {
                            //                         "value": order.items[0].spu_name,
                            //                         "color": "#173177"
                            //                     },
                            //                     "keyword3": {
                            //                         "value": order.logistics_code,
                            //                         "color": "#173177"
                            //                     },
                            //                     "keyword4": {
                            //                         "value": order.logistics_company,
                            //                         "color": "#173177"
                            //                     },
                            //                     "keyword5": {
                            //                         "value": app.moment(order.logistics_time).format('YYYY年MM月DD日'),
                            //                         "color": "#173177"
                            //                     }
                            //                 }
                            //                 // ,emphasis_keyword: "keyword3.DATA"
                            //             }
                            //             console.log(sendData);
                            //             console.log(JSON.stringify(sendData));
                            //             var wrapperResult = app.app_weixin.sendTemplateMessage(config.app_id, JSON.stringify(sendData));
                            //             if (wrapperResult.success) {
                            //                 bizScene.use_flag = true;
                            //                 bizScene.used_on = app.moment();
                            //                 bizScene.send_data = send_data;
                            //                 bizScene.use_for_name = 'mws_order';
                            //                 bizScene.use_for_id = order.id;
                            //                 yield  bizScene.save();
                            //             }
                            //         }
                            //     }
                            // }
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