/**
 * Created by zppro on 15-12-14.
 */

var co = require('co');
var moment = require("moment");
var paddingStr = require('rfcore').util.paddingStr;
var _ = require('underscore');
var assert = require('assert').ok;
var seqence_defs = {};

module.exports = {
    init:function(ctx){
        this.ctx = ctx;
        this.modelFactory = ctx.modelFactory();
        this.sequence_model = ctx.models['pub_sequence'];
        return this;
    },
    factory: function (seq_id) {
        var sequenceDef = seqence_defs[seq_id];
        if (!sequenceDef) {
            sequenceDef = require('../sequences/' + seq_id);
            if(!sequenceDef.disabled) {
                sequenceDef.init && sequenceDef.init(this.ctx);
                seqence_defs[seq_id] = sequenceDef;
                console.log('create sequenceDef use ' + seq_id + '...');
            }
        }
        return sequenceDef;
    },
    getSequenceVal : function(seq_id, areaCode, object_key_path) {//areaCode 必须是6位地区码
        var self = this;
        return co(function *() {
            var sequenceDef = seqence_defs[seq_id];

            if (!sequenceDef) {
                assert('cant find sequence def')
                return null;
            }

            //console.log(seq_id);
            //console.log(sequenceDef);

            var _date_area_period = '';
            var _date_area_period_format =  sequenceDef.date_area_period_format || sequenceDef.date_period_format;
            var matches = _date_area_period_format.toLowerCase().match(/pp|cc|aa/gi);
            if(matches && matches.length > 0){
                for(var i=0;i<matches.length;i++) {
                    if (matches[0] == 'pp') {
                        _date_area_period = _date_area_period + areaCode.substr(0, 2);
                    }
                    if (matches[0] == 'cc') {
                        _date_area_period = _date_area_period + areaCode.substr(2, 2);
                    }
                    if (matches[0] == 'aa') {
                        _date_area_period = _date_area_period + areaCode.substr(4, 2);
                    }
                }
            } else {
                _date_area_period = moment().format(_date_area_period_format);
            }

            var sequenceDefInstance = _.defaults({
                date_area_period: _date_area_period,
                object_key: object_key_path ? (sequenceDef.object_key + '-' + object_key_path) : sequenceDef.object_key
            }, sequenceDef);
            var sequences = yield self.modelFactory.model_query(self.sequence_model, {
                where: {
                    object_type: sequenceDefInstance.object_type,
                    object_key: sequenceDefInstance.object_key,
                    date_area_period: sequenceDefInstance.date_area_period
                }
            });

            var sequence;
            if (sequences.length == 1) {
                sequence = sequences[0];
            }
            else {
                if (sequences.length > 1) {
                    assert('the sequence find more than one!');
                    return null;
                }
            }
            if (!sequence) {
                sequence = yield self.modelFactory.model_create(self.sequence_model, sequenceDefInstance);
            }
            else {

                if(sequenceDefInstance.prefix != sequence.prefix ){
                    sequence.prefix = sequenceDefInstance.prefix;
                }
                if(sequenceDefInstance.suffix != sequence.suffix ){
                    sequence.suffix = sequenceDefInstance.suffix;
                }
                if(sequenceDefInstance.date_area_period_format != sequence.date_area_period_format ){
                    sequence.date_area_period_format = sequenceDefInstance.date_area_period_format;
                }
                if(sequenceDefInstance.min != sequence.min ){
                    sequence.min = sequenceDefInstance.min;
                }
                if(sequenceDefInstance.max != sequence.max ){
                    sequence.max = sequenceDefInstance.max;
                }
                if(sequenceDefInstance.step != sequence.step ){
                    sequence.step = sequenceDefInstance.step;
                }
            }

            console.log(sequence);
            if (sequence.close_flag) {
                assert('sequence overflow!');
                return null;
            }

            if (sequence.current + 1 > sequence.max) {
                sequence.close_flag = true;
            }

            var no = (sequence.prefix || '') + sequence.date_area_period + (sequence.suffix || '') + paddingStr('' + sequence.current, '0', ('' + sequence.max).length - ('' + sequence.current).length);
            sequence.current = sequence.current + sequence.step;
            yield sequence.save();//self update to current

            console.log(no);
            //console.log(sequence.current);

            return no;
        }).catch(function(err){
            console.log(err)
        });
    }
};