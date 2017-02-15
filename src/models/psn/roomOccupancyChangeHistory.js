/**
 * roomOccupancyChangeHistory Created by zppro on 17-2-15.
 * Target:房间入住情况变动历史 (移植自fsrok)
 */
var mongoose = require('mongoose');
module.isloaded = false;


module.exports = function(ctx,name) {
    if (module.isloaded) {
        return mongoose.model(name);
    }
    else {
        module.isloaded = true;

        var roomOccupancyChangeHistorySchema = new mongoose.Schema({
            check_in_time: {type: Date, default: Date.now},
            roomId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'psn_room'},
            bed_no: {type: Number, required: true, min: 1},
            room_summary: {type: String, required: true},//districtName-roomName-bedNo
            elderlyId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'psn_elderly'},
            elderly_summary: {type: String, required: true},//name-id_no
            in_flag: {type: Boolean, required: true},//入住标志 true-入住 false-搬离
            check_out_time: {type: Date},
            tenantId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'pub_tenant'}
        });


        return mongoose.model(name, roomOccupancyChangeHistorySchema, name);
    }
}