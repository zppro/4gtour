/**
 * Created by zppro on 17-3-29.
 * Target:睡眠带信息更新 http://nodeclass.com/articles/78767
 */

var schedule = require('node-schedule');

var job_id = 'bedMonitorInfoUpdate';
var job_name =  '睡眠带信息更新';
var printLog = true;

module.exports = {
    needRegister: true,
    register: function (ctx) {
        if (this.needRegister) {
            var job_rule = '*/1 * * * *';//每分钟
            ctx.jobManger.createJob(job_id, job_name, job_rule, ()=> {
                console.log(ctx.moment().format('HH:mm:ss') + ' ' + job_id + '(' + job_name + ') => executing.');

                // console.log(ctx.moment().format('HH:mm:ss') + ' ' + job_id + '(' + job_name + ') => executed.');
            }, {printLog: printLog});
        }
        else {
            console.log(job_id + '(' + job_name + ') => skip register.');
        }
    }
}