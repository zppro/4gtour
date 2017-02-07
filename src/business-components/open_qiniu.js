/**
 * Created by zppro on 17-2-6.
 */
var co = require('co');
var rp = require('request-promise-native');
var qiniu = require('qiniu');
var qiniuExt = require('node-qiniu');
var fs = require('fs-extra');
var path = require('path');
module.exports = {
    init: function (ctx) {
        console.log('init open_qiniu... ');
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

        qiniu.conf.ACCESS_KEY = 'icuD_ORmQEtx79qweXz60YEJPvuMN9XYjOWUZG_s';
        qiniu.conf.SECRET_KEY = 'adLkjl-7Velkq-3BjyCccrcJZhjQzH6VyAs7DK6t';

        qiniuExt.config({
            access_key: qiniu.conf.ACCESS_KEY ,
            secret_key: qiniu.conf.SECRET_KEY
        });

        this.default_bucket = '4gimg';
        this.default_bucket_download_url_prefix = 'http://img2.okertrip.com/';

        this.client =  new qiniu.rs.Client();

        console.log(this.filename + ' ready... ');
        return this;
    },
    genUploadToken : function (key, bucket, user) {
        bucket = bucket || this.default_bucket;
        var pubPolicyObj = {
            scope: key ? bucket + ':' + key : bucket,
            expire: this.ctx.moment().add(1, 'day'),
            endUser: user
        };
        var pubPolicy = new qiniu.rs.PutPolicy2(pubPolicyObj);
        var uploadToken = pubPolicy.token();
        return uploadToken;
    },
    stat: function (key, bucket) {
        var self = this;
        bucket = bucket || this.default_bucket;
        return co(function *() {
            try {
                var ret =  yield self.ctx.wrapper.cb(self.client.stat)(bucket, key);
                console.log(ret);
                return ret;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    remove: function (key, bucket) {
        var self = this;
        bucket = bucket || this.default_bucket;
        return co(function *() {
            try {
                var ret =  yield self.ctx.wrapper.cb(self.client.remove)(bucket, key);
                console.log(ret);
                return ret;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    upload: function(file, removeRaw, bucket, bucketDownloadUrlPrefix) {
        var self = this;
        return co(function *() {
            try {
                var uploadBucket = qiniuExt.bucket(bucket || self.default_bucket);
                var puttingStream = uploadBucket.createPutStream(path.basename(file));
                var readingStream = fs.createReadStream(file);
                var uploadPromise = new Promise(function (resolve, reject) {
                    readingStream.pipe(puttingStream)
                        .on('error', function(err) {
                            console.log(err);
                            self.logger.error(err.message);
                            reject();
                        })
                        .on('end', function(reply) {
                            resolve(reply);
                            if (removeRaw) fs.removeSync(file)
                        });
                });
                var uploadRet =  yield uploadPromise;
                if(!uploadRet) {
                    return self.ctx.wrapper.res.error({code: 53993 ,message: 'qiniu upload error' });
                }
                return self.ctx.wrapper.res.ret((bucketDownloadUrlPrefix || self.default_bucket_download_url_prefix) + uploadRet.key + '?hash=' + uploadRet.hash);
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    }
};