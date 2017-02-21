/**
 * Created by zppro on 17-2-20.
 * 个人健康助手移动接口 personal health center
 */
var rp = require('request-promise-native');
var DIC = require('../pre-defined/dictionary-constants.json');
var caddress = require('../pre-defined/caddress.json');
module.exports = {
    init: function (option) {
        var self = this;
        this.file = __filename;
        this.filename = this.file.substr(this.file.lastIndexOf('/') + 1);
        this.module_name = this.filename.substr(0, this.filename.lastIndexOf('.'));
        this.service_url_prefix = '/me-services/' + this.module_name.split('_').join('/');
        this.log_name = 'mesvc_' + this.filename;
        option = option || {};

        this.logger = require('log4js').getLogger(this.log_name);

        if (!this.logger) {
            console.error('logger not loaded in ' + this.file);
        }
        else {
            this.logger.info(this.file + " loaded!");
        }
        
        this.actions = [
        ];

        return this;
    }
}.init();
//.init(option);