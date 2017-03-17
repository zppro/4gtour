/**
 * Created by hcl on 17-3-14.
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

        this.actions=[
            {
                method: 'sleepUser$regist',
                verb: 'post',
                url: this.service_url_prefix + "/sleepUser$regist",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            this.body = yield app.nursing_bed_monitor_provider.regist(this.request.body);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                }
            },
	    {
                   method:'sleepUser$isRegist' ,
                    verb:'get',
                    url:this.service_url_prefix+"/sleepUser$isRegist/:userName",
                    handler:function (app,options) {
                        return function *(next) {
                            try {

                                this.body = yield app.nursing_bed_monitor_provider.isRegist(this.params.userName);
                            } catch (e) {
                                self.logger.error(e.message);
                                this.body = app.wrapper.res.error(e);
                            }
                            yield next;
                        };
                    }
               },
               {
                   method:'sleepUser$getToken' ,
                    verb:'get',
                    url:this.service_url_prefix+"/sleepUser$getToken/:uniqueId",
                    handler:function (app,options) {
                        return function *(next) {
                            try {

                                this.body = yield app.nursing_bed_monitor_provider.getToken(this.params.uniqueId);
                            } catch (e) {
                                self.logger.error(e.message);
                                this.body = app.wrapper.res.error(e);
                            }
                            yield next;
                        };
                    }
                },
 		 {
                method: 'sleepUser$userAuthenticate',
                verb: 'post',
                url: this.service_url_prefix + "/sleepUser$userAuthenticate",
                handler: function (app, options) {
                    return function *(next) {
                        try {
                            this.body = yield app.nursing_bed_monitor_provider.userAuthenticate(this.request.body);
                        } catch (e) {
                            self.logger.error(e.message);
                            this.body = app.wrapper.res.error(e);
                        }
                        yield next;
                    };
                 }
               },
               {
                        method: 'sleepUser$userLogOut',
                        verb: 'post',
                        url: this.service_url_prefix + "/sleepUser$userLogOut",
                        handler: function (app, options) {
                            return function *(next) {
                                try {
                                    this.body = yield app.nursing_bed_monitor_provider.userLogOut(this.request.body);
                                } catch (e) {
                                    self.logger.error(e.message);
                                    this.body = app.wrapper.res.error(e);
                                }
                                yield next;
                            };
                         }
               },
	{
	           method: 'sleepUser$updateUserPassword',
	           verb: 'post',
	           url: this.service_url_prefix + "/sleepUser$updateUserPassword",
	           handler: function (app, options) {
				return function *(next) {
				    try {
				            this.body = yield app.nursing_bed_monitor_provider.userLogOut(this.request.body);
				     } catch (e) {
				            self.logger.error(e.message);
				            this.body = app.wrapper.res.error(e);
				     }
				        yield next;
				    };
			 }
	 },
	{
		method: 'sleepUser$getUserDetail',
		verb: 'post',
		url: this.service_url_prefix + "/sleepUser$getUserDetail",
		handler: function (app, options) {
			return function *(next) {
			              try {
				            this.body = yield app.nursing_bed_monitor_provider.getUserDetail(this.request.body);
				 } catch (e) {
				            self.logger.error(e.message);
				            this.body = app.wrapper.res.error(e);
				 }
				        yield next;
			};
		}
	},
		{
			method: 'sleepUser$updateUserDetail',
			verb: 'post',
			url: this.service_url_prefix + "/sleepUser$updateUserDetail",
			handler: function (app, options) {
				return function *(next) {
				        try {
				            this.body = yield app.nursing_bed_monitor_provider.updateUserDetail(this.request.body);
				        } catch (e) {
				            self.logger.error(e.message);
				            this.body = app.wrapper.res.error(e);
				        }
				        yield next;
				 };
			}
		 },
		{
			method: 'sleepUser$sessionIsExpired',
			verb: 'post',
			url: this.service_url_prefix + "/sleepUser$sessionIsExpired",
			handler: function (app, options) {
			             return function *(next) {
				        try {
					       console.log("body:");
					       console.log(this.request.body);
				            this.body = yield app.nursing_bed_monitor_provider.sessionIsExpired(this.request.body);
				        } catch (e) {
				            self.logger.error(e.message);
				            this.body = app.wrapper.res.error(e);
				        }
				        yield next;
				    };
				 }
		 },
		{
			method: 'sleepUser$submitFeedback',
			verb: 'post',
			url: this.service_url_prefix + "/sleepUser$submitFeedback",
			handler: function (app, options) {
				return function *(next) {
				             try {
						  console.log("body:");
						   console.log(this.request.body);
				                            this.body = yield app.nursing_bed_monitor_provider.submitFeedback(this.request.body);
				                 } catch (e) {
				            self.logger.error(e.message);
				            this.body = app.wrapper.res.error(e);
				                }
				        yield next;
				};
			}
		 },
                            {
                                method: 'sleepConcernPerson$getConcernPerson',
                                verb: 'post',
                                url: this.service_url_prefix + "/sleepConcernPerson$getConcernPerson",
                                handler: function (app, options) {
                                    return function *(next) {
                                                 try {
                                              console.log("body:");
                                               console.log(this.request.body);
                                                                this.body = yield app.nursing_bed_monitor_provider.getConcernPerson(this.request.body);
                                                     } catch (e) {
                                                self.logger.error(e.message);
                                                this.body = app.wrapper.res.error(e);
                                                    }
                                            yield next;
                                    };
                                }
                             },
                               {
                                method: 'sleepConcernPerson$updateConcernPerson',
                                verb: 'post',
                                url: this.service_url_prefix + "/sleepConcernPerson$updateConcernPerson",
                                handler: function (app, options) {
                                    return function *(next) {
                                                 try {
                                              console.log("body:");
                                               console.log(this.request.body);
                                                                this.body = yield app.nursing_bed_monitor_provider.updateConcernPerson(this.request.body);
                                                     } catch (e) {
                                                self.logger.error(e.message);
                                                this.body = app.wrapper.res.error(e);
                                                    }
                                            yield next;
                                    };
                                }
                             },
                               {
                                method: 'sleepConcernPerson$getCpAttachedDev',
                                verb: 'post',
                                url: this.service_url_prefix + "/sleepConcernPerson$getCpAttachedDev",
                                handler: function (app, options) {
                                    return function *(next) {
                                                 try {
                                              console.log("body:");
                                               console.log(this.request.body);
                                                                this.body = yield app.nursing_bed_monitor_provider.getCpAttachedDev(this.request.body.sessionId,this.request.body.cpId);
                                                     } catch (e) {
                                                self.logger.error(e.message);
                                                this.body = app.wrapper.res.error(e);
                                                    }
                                            yield next;
                                    };
                                }
                             },
                               {
                                        method: 'sleepConcernPerson$updateConcernPersonParam',
                                        verb: 'post',
                                        url: this.service_url_prefix + "/sleepConcernPerson$updateConcernPersonParam",
                                        handler: function (app, options) {
                                            return function *(next) {
                                                         try {
                                                      console.log("body:");
                                                       console.log(this.request.body);
                                                                        this.body = yield app.nursing_bed_monitor_provider.updateConcernPersonParam(this.request.body);
                                                             } catch (e) {
                                                        self.logger.error(e.message);
                                                        this.body = app.wrapper.res.error(e);
                                                            }
                                                    yield next;
                                            };
                                        }
                             },
                               {
                                        method: 'sleepDevicews$updateDeviceAttachState',
                                        verb: 'post',
                                        url: this.service_url_prefix + "/sleepDevicews$updateDeviceAttachState",
                                        handler: function (app, options) {
                                            return function *(next) {
                                                         try {
                                                      console.log("body:");
                                                       console.log(this.request.body);
                                                                        this.body = yield app.nursing_bed_monitor_provider.updateDeviceAttachState(this.request.body);
                                                             } catch (e) {
                                                        self.logger.error(e.message);
                                                        this.body = app.wrapper.res.error(e);
                                                            }
                                                    yield next;
                                            };
                                        }
                             },
                               {
                                    method: 'sleepDevicews$updateDevice',
                                    verb: 'post',
                                    url: this.service_url_prefix + "/sleepDevicews$updateDevice",
                                    handler: function (app, options) {
                                        return function *(next) {
                                                     try {
                                                  console.log("body:");
                                                   console.log(this.request.body);
                                                                    this.body = yield app.nursing_bed_monitor_provider.updateDevice(this.request.body);
                                                         } catch (e) {
                                                    self.logger.error(e.message);
                                                    this.body = app.wrapper.res.error(e);
                                                        }
                                                yield next;
                                        };
                                    }
                             },
                               {
                                method: 'sleepDevicews$getManufactDev',
                                verb: 'post',
                                url: this.service_url_prefix + "/sleepDevicews$getManufactDev",
                                handler: function (app, options) {
                                    return function *(next) {
                                                 try {
                                              console.log("body:");
                                               console.log(this.request.body);
                                                                this.body = yield app.nursing_bed_monitor_provider.getManufactDev(this.request.body);
                                                     } catch (e) {
                                                self.logger.error(e.message);
                                                this.body = app.wrapper.res.error(e);
                                                    }
                                            yield next;
                                    };
                                }
                             },
                               {
                                method: 'sleepDevicews$getDevListByType',
                                verb: 'post',
                                url: this.service_url_prefix + "/sleepDevicews$getDevListByType",
                                handler: function (app, options) {
                                    return function *(next) {
                                                 try {
                                              console.log("body:");
                                               console.log(this.request.body);
                                                                this.body = yield app.nursing_bed_monitor_provider.getDevListByType(this.request.body);
                                                     } catch (e) {
                                                self.logger.error(e.message);
                                                this.body = app.wrapper.res.error(e);
                                                    }
                                            yield next;
                                    };
                                }
                             },
                               {
                                method: 'sleepDevicews$getAllDevInfoList',
                                verb: 'post',
                                url: this.service_url_prefix + "/sleepDevicews$getAllDevInfoList",
                                handler: function (app, options) {
                                    return function *(next) {
                                                 try {
                                              console.log("body:");
                                               console.log(this.request.body);
                                                                this.body = yield app.nursing_bed_monitor_provider.getAllDevInfoList(this.request.body);
                                                     } catch (e) {
                                                self.logger.error(e.message);
                                                this.body = app.wrapper.res.error(e);
                                                    }
                                            yield next;
                                    };
                                }
                             },
                               {
                                method: 'sleepDevicews$getUserCpDevList',
                                verb: 'post',
                                url: this.service_url_prefix + "/sleepDevicews$getUserCpDevList",
                                handler: function (app, options) {
                                    return function *(next) {
                                                 try {
                                              console.log("body:");
                                               console.log(this.request.body);
                                                                this.body = yield app.nursing_bed_monitor_provider.getUserCpDevList(this.request.body);
                                                     } catch (e) {
                                                self.logger.error(e.message);
                                                this.body = app.wrapper.res.error(e);
                                                    }
                                            yield next;
                                    };
                                }
                             },
                               {
                                method: 'sleepDevicews$getDevAlarmSetting',
                                verb: 'post',
                                url: this.service_url_prefix + "/sleepDevicews$getDevAlarmSetting",
                                handler: function (app, options) {
                                    return function *(next) {
                                                 try {
                                              console.log("body:");
                                               console.log(this.request.body);
                                                                this.body = yield app.nursing_bed_monitor_provider.getDevAlarmSetting(this.request.body);
                                                     } catch (e) {
                                                self.logger.error(e.message);
                                                this.body = app.wrapper.res.error(e);
                                                    }
                                            yield next;
                                    };
                                }
                             },
                               {
                                method: 'sleepDevicews$updateDevAlarmSetting',
                                verb: 'post',
                                url: this.service_url_prefix + "/sleepDevicews$updateDevAlarmSetting",
                                handler: function (app, options) {
                                    return function *(next) {
                                                 try {
                                              console.log("body:");
                                               console.log(this.request.body);
                                                                this.body = yield app.nursing_bed_monitor_provider.updateDevAlarmSetting(this.request.body);
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
