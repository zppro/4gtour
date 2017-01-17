/**
 * Created by zppro on 17-1-17.
 */
var co = require('co');
var DIC = require('../pre-defined/dictionary-constants.json');
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
    appendSaleInfoByOrderPaySuccess: function (order) {
        var self = this;
        return co(function *() {
            try {
                // && order.order_status == DIC.MWS01.WAITING_SHIP
                if (order) {
                    // var today = app.moment();
                    // var yesterday = today.add(-1, 'days');
                    // var isSameMonth = today.isSame(yesterday, 'month')
                    var orderItems = order.items;
                    var spus_object = {};
                    for (var index=0;index< orderItems.length;index++) {
                        var o = orderItems[index];
                        var spu_id = o.spu_id;
                        var spu = spus_object[spu_id];

                        if (!spu) {
                            spu = (yield self.ctx.modelFactory().model_read(self.ctx.models['mws_spu'], spu_id));
                            if (spu) {
                                spus_object[spu_id] = spu;
                            }
                        }
                        // console.log('spu.skus')
                        // console.log(o.sku_id);
                        // console.log(spu.skus);

                        for (var i = 0; i < spu.skus.length; i++) {
                            if (spu.skus[i]._id.toString() == o.sku_id) {
                                console.log('before')
                                console.log(spu.skus[i])

                                spu.skus[i].sales_monthly += 1;
                                spu.skus[i].sales_all += 1;
                                console.log('after')
                                console.log(spu.skus[i])
                                break;
                            }
                        }
                    }
                    // console.log('spus_object')
                    // console.log(spus_object);
                    for (var key in spus_object) {
                        yield spus_object[key].save();
                    }
                }
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    }
};