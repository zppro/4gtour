/**
 * Created by zppro on 17-3-29.
 * Target:睡眠带信息更新 http://nodeclass.com/articles/78767
 */
 var co = require('co');
 var schedule = require('node-schedule');

 var job_id = 'bedMonitorInfoUpdate';
 var job_name =  '睡眠带信息更新';
 var printLog = true;

 module.exports = {
    needRegister: true,
    register: function (ctx) {
        if (this.needRegister) {
            return co(function*() {
            
                yield ctx.bed_monitor_provider.autoRegistLogin();
            var job_rule = '*/1 * * * *';//每分钟
            ctx.jobManger.createJob(job_id, job_name, job_rule, ()=> {
                console.log(ctx.moment().format('HH:mm:ss') + ' ' + job_id + '(' + job_name + ') => executing.');
                    ctx.bed_monitor_provider.UpdatebedMonitorInfo();
                // console.log(ctx.moment().format('HH:mm:ss') + ' ' + job_id + '(' + job_name + ') => executed.');
            }, {printLog: printLog});
        
 }).catch(ctx.coOnError);
        }
        else {
            console.log(job_id + '(' + job_name + ') => skip register.');
        }
    }
}