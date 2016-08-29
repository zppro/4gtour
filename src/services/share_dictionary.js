/**
 * Created by zppro on 16-8-28.
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
                method: 'fetch',
                verb: 'get',
                url: this.service_url_prefix + "/:dictionaryId/:format",
                handler: function (app, options) {
                    return function * (next) {
                        try {
                            if(this.params.format=='array') {
                                var rows = [];
                                app._.each(app.dictionary.pairs[this.params.dictionaryId], function (v, k) {
                                    if (k != 'name') {
                                        rows.push(app._.defaults(v, {value: k}));
                                    }
                                });
                                this.body = app.wrapper.res.rows(rows);
                            }
                            else {
                                this.body = app.wrapper.res.ret(app.dictionary.pairs[this.params.dictionaryId]);
                            }
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