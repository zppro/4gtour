/**
 * pft Created by zppro on 16-11-1.
 * Target:处理邮件相关
 */
var co = require('co');
var nodemailer = require('nodemailer');
var IDC02 = require('../pre-defined/dictionary.json')['IDC02'];

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

        //120cc 13003673092  密码gxr888
        //正式smtp账号：读取发送时传入配置
        //测试smtp账号 服务；QQex 邮箱：service@carrycheng.com 密码：Service2016
        this.transporters['QQex-tester'] = nodemailer.createTransport({
            aliases: ['QQ Enterprise'],
            domains: ['exmail.qq.com'],
            host: 'smtp.exmail.qq.com',
            port: 465,
            secure: true, // use SSL
            auth: {
                user: 'service@carrycheng.com',
                pass: 'Service2016'
            }
        });
        console.log(this.filename + ' ready... ');


        return this;
    },
    sendTest: function () {
        var self = this;
        return co(function *() {
            try {
                var transporter = self.transporters['QQex-tester']
                var mailOptions = {
                    from: '"service" <service@carrycheng.com>', // sender address
                    to: 'zhouh@carrycheng.com', // list of receivers
                    subject: '这是一封来自sh.okertrip.com的测试邮件', // Subject line
                    text: '自动发送,请勿回复'// plaintext body
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
                var user = 'service@carrycheng.com';
                if (!self.transporters[user]) {
                    self.transporters[user] = nodemailer.createTransport({
                        aliases: ['QQ Enterprise'],
                        domains: ['exmail.qq.com'],
                        host: 'smtp.exmail.qq.com',
                        port: 465,
                        secure: true, // use SSL
                        auth: {
                            user: user,
                            pass: 'Service2016'
                        }
                    });
                }
                var transporter = self.transporters[user];
                var pay_time = self.ctx.moment(info.pay_time || Date.now).format('YYYY-MM-DD HH:mm:ss');
                var pay_type = (IDC02[info.pay_type]||{}).name || '';
                var mailOptions = {
                    from: '"四季游服务" <' + user + '>', // sender address
                    to: 'zhouh@carrycheng.com', // list of receivers
                    subject: '【付款通知】 订单号<' + info.code + '>已支付', // Subject line
                    text: '订单号：' + info.code + '\r\n金额:￥' + info.amount + '\r\n支付方式:'+ pay_type + '\r\n付款时间：' + pay_time +' \r\n【自动发送,请勿回复】'// plaintext body
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
    }
};