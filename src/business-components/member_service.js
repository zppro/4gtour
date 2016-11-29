/**
 * Created by zppro on 16-11-8.
 */
var co = require('co');

module.exports = {
    transporters : {},
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
    checkIn : function (member_id, member_name, member_head_portrait) {
        var self = this;
        return co(function *() {
            try {
                var member = yield self.ctx.modelFactory().model_one(self.ctx.models['trv_member'], {where:{code: member_id}})
                if (member) {
                    member.name = member_name;
                    member.head_portrait = member_head_portrait;
                    member.check_status = 1;
                    yield member.save()
                } else {
                    yield self.ctx.modelFactory().model_create(self.ctx.models['trv_member'], {code: member_id, name: member_name, head_portrait: member_head_portrait, check_status: 1})
                }
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    checkOut: function (code) {
        var self = this;
        return co(function *() {
            try {
                var member = yield self.ctx.modelFactory().model_one(self.ctx.models['trv_member'], {where:{code: member_id}})
                if (member) {
                    member.check_status = 0;
                    yield member.save()
                }
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    },
    addHrefToName: function (content) {
        var self = this;
        return co(function *() {
            try {
                if(!content) content = '';
                var reg = new RegExp(/\/\/@([^\/]+):/gi);
                var matches=[],match;
                while(match=reg.exec(content)){
                    match.shift();
                    matches.push(match);
                }
                if(matches && matches.length > 0){
                    var names = self.ctx._.map(matches,function(o){return o[0]});
                    var members = yield self.ctx.modelFactory().model_query(self.ctx.models['trv_member'], {where:{name: {$in: names }},select: 'code name'});
                    for(var i= 0;i< matches.length;i++){
                        var member_name = matches[i][0];
                        var theOne = self.ctx._.find(members,function(o){ return o.name == member_name;});
                        if(theOne){
                            content = content.replace('//@' + member_name + ':', '//<a class="member-name-link" href="/member-profile/' + theOne.code + '">@' + member_name + '</a>:')
                        }
                    }
                }
                return content;
            }
            catch (e) {
                console.log(e);
                self.logger.error(e.message);
            }
        }).catch(self.ctx.coOnError);
    }
};