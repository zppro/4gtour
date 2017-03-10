/**
 * mail Created by zppro on 16-11-1.
 * Target:处理邮件相关
 */
var co = require('co');
var nodemailer = require('nodemailer');
var IDC02 = require('../../pre-defined/dictionary.json')['IDC02'];
var mailConfig = require('../../pre-defined/mail-config.json');

module.exports = {
    transporters : {},
    init: function (ctx) {
        console.log('init mail... ');
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

        this.transporters['QQex-tester'] = nodemailer.createTransport({
            aliases: ['QQ Enterprise'],
            domains: ['exmail.qq.com'],
            host: 'smtp.exmail.qq.com',
            port: 465,
            secure: true, // use SSL
            auth: {
                user: mailConfig.test.user,
                pass: mailConfig.test.pass
            }
        });
        console.log(this.filename + ' ready... ');


        return this;
    },
    sendTest: function (subject, content) {
        var self = this;
        return co(function *() {
            try {
                var transporter = self.transporters['QQex-tester']
                var mailOptions = {
                    from: '"测试A" <' + mailConfig.test.user + '>', // sender address
                    to: 'zhongp@carrycheng.com', // list of receivers
                    subject: '[测试] '+ subject, // Subject line
                    text: content// plaintext body
                };
                // send mail with defined transport object
                var ret = yield transporter.sendMail(mailOptions);
                return ret;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    send$PFTOrderPaySuccess: function (info) {
        var self = this;
        return co(function *() {
            try {
                // 将来考虑配置化
                var user = mailConfig.orderPaySuccess.user;
                if (!self.transporters[user]) {
                    self.transporters[user] = nodemailer.createTransport({
                        aliases: ['QQ Enterprise'],
                        domains: ['exmail.qq.com'],
                        host: 'smtp.exmail.qq.com',
                        port: 465,
                        secure: true, // use SSL
                        auth: {
                            user: user,
                            pass: mailConfig.orderPaySuccess.pass
                        }
                    });
                }
                var transporter = self.transporters[user];
                var pay_time = self.ctx.moment(info.pay_time || Date.now).format('YYYY-MM-DD HH:mm:ss');
                var pay_type = (IDC02[info.pay_type]||{}).name || '';
                var mailOptions = {
                    from: '"梧斯源服务" <' + user + '>', // sender address
                    to: 'zhouh@carrycheng.com', // list of receivers
                    subject: '【付款通知】 订单号<' + info.code + '>已支付', // Subject line
                    text: '订单号：' + info.code + '\r\n金额:￥' + info.amount + '\r\n支付方式:'+ pay_type + '\r\n付款时间：' + pay_time +' \r\n【自动发送,请勿回复】'// plaintext body
                };
                console.log(mailOptions)
                self.logger.info(mailOptions);
                // send mail with defined transport object
                var ret = yield transporter.sendMail(mailOptions);
                return ret;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    }
};