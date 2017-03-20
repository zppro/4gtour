/**
 * Created by hcl on 17-3-14.
 */
module.exports = {
    init: function (option) {
        var self = this;
        this.file = __filename;
        this.filename = this.file.substr(this.file.lastIndexOf('/') + 1);
        this.module_name = this.filename.substr(0, this.filename.lastIndexOf('.'));
        this.service_url_prefix = '/debug-services/' + this.module_name.split('_').join('/');
        this.log_name = 'svc_' + this.filename;
        option = option || {};

        this.logger = require('log4js').getLogger(this.log_name);

        if (!this.logger) {
            console.error('logger not loaded in ' + this.file);
        }
        else {
            this.logger.info(this.file + " loaded!");
        }

        this.actions=[
            {
                method: 'SLEEP$regist',
                verb: 'post',
                url: this.service_url_prefix + "/SLEEP$regist",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            this.body = yield app.user_sleep.regist(this.request.body);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
	    {
                   method:'SLEEP$isRegist' ,
                    verb:'get',
                    url:this.service_url_prefix+"/SLEEP$isRegist/:userName",
                    handler:function (app,options) {
                        return function *(next) {
                            try {

                                this.body = yield app.user_sleep.isRegist(this.params.userName);
                            } catch (e) {
                                self.logger.error(e.message);
                                this.body = app.wrapper.res.error(e);
                            }
                            yield next;
                        };
                    }
               },
               {
                   method:'SLEEP$getToken' ,
                    verb:'get',
                    url:this.service_url_prefix+"/SLEEP$getToken/:uniqueId",
                    handler:function (app,options) {
                        return function *(next) {
                            try {

                                this.body = yield app.user_sleep.getToken(this.params.uniqueId);
                            } catch (e) {
                                self.logger.error(e.message);
                                this.body = app.wrapper.res.error(e);
                            }
                            yield next;
                        };
                    }
                },
 		 {
                method: 'SLEEP$userAuthenticate',
                verb: 'post',
                url: this.service_url_prefix + "/SLEEP$userAuthenticate",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            this.body = yield app.user_sleep.userAuthenticate(this.request.body);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                 }
               },
		{
                method: 'SLEEP$userLogOut',
                verb: 'post',
                url: this.service_url_prefix + "/SLEEP$userLogOut",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            this.body = yield app.user_sleep.userLogOut(this.request.body);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                 }
               },
		{
				method: 'SLEEP$updateUserPassword',
				verb: 'post',
				url: this.service_url_prefix + "/SLEEP$updateUserPassword",
				handler: function (app, options) {
				    return function *(next) {
				        try {
				            this.body = yield app.user_sleep.userLogOut(this.request.body);
				        } catch (e) {
				            self.logger.error(e.message);
				            this.body = app.wrapper.res.error(e);
				        }
				        yield next;
				    };
				 }
		 },
		{
				method: 'SLEEP$getUserDetail',
				verb: 'post',
				url: this.service_url_prefix + "/SLEEP$getUserDetail",
				handler: function (app, options) {
				    return function *(next) {
				        try {
				            this.body = yield app.user_sleep.getUserDetail(this.request.body);
				        } catch (e) {
				            self.logger.error(e.message);
				            this.body = app.wrapper.res.error(e);
				        }
				        yield next;
				    };
				 }
		 },
		{
				method: 'SLEEP$updateUserDetail',
				verb: 'post',
				url: this.service_url_prefix + "/SLEEP$updateUserDetail",
				handler: function (app, options) {
				    return function *(next) {
				        try {
				            this.body = yield app.user_sleep.updateUserDetail(this.request.body);
				        } catch (e) {
				            self.logger.error(e.message);
				            this.body = app.wrapper.res.error(e);
				        }
				        yield next;
				    };
				 }
		 },
		{
				method: 'SLEEP$sessionIsExpired',
				verb: 'post',
				url: this.service_url_prefix + "/SLEEP$sessionIsExpired",
				handler: function (app, options) {
				    return function *(next) {
				        try {
						     console.log("body:");
						    console.log(this.request.body);
				            this.body = yield app.user_sleep.sessionIsExpired(this.request.body);
				        } catch (e) {
				            self.logger.error(e.message);
				            this.body = app.wrapper.res.error(e);
				        }
				        yield next;
				    };
				 }
		 },
		{
				method: 'SLEEP$submitFeedback',
				verb: 'post',
				url: this.service_url_prefix + "/SLEEP$submitFeedback",
				handler: function (app, options) {
				    return function *(next) {
				        try {
						     console.log("body:");
						    console.log(this.request.body);
				            this.body = yield app.user_sleep.submitFeedback(this.request.body);
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
