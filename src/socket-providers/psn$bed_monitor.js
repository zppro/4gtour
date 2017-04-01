/**
 * Created by zppro on 17-3-30.
 */
var co = require('co');
var socketClientEvents = require('../pre-defined/socket-client-events.json');
var socketServerEvents = require('../pre-defined/socket-server-events.json');
var DIC = require('../pre-defined/dictionary-constants.json');
module.exports = {
    init: function (ctx, ioSocket) {
        console.log('init psn_bed_monitor socketProvider... ');
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
        this.ioSocket = ioSocket;

        // add namespace
        this.socketClientsOfPSN$BedMonitor = {};
        this.nspOfPSN$bed_monitor = this.ioSocket.of('/psn$bed_monitor');
        this.nspOfPSN$bed_monitor.on('connection', this.onConnection.bind(this));

        console.log(this.filename + ' ready... ');
 
        return this;
    },
    sendToClient: function (eventName, eventData) {
        console.log('eventName: ', eventName);
        console.log('eventData: ', eventData);
        if (eventData.bedMonitorName) {
            console.log('sendToClient psn$bed_monitor to bedMonitor : ' + 'bedMonitor_' + eventData.bedMonitorName);
            this.nspOfPSN$bed_monitor.to('bedMonitor_' + eventData.bedMonitorName).emit(eventName, eventData);
        } else {
            console.log('sendToClient psn$bed_monitor to whole channel');
            this.nspOfPSN$bed_monitor.emit(eventName, eventData);
        }
    },
    onConnection: function (socket) {
        var self = this;
        console.log('nsp psn$bedmonitor connection: ' + socket.id);
        self.socketClientsOfPSN$BedMonitor[socket.id] = socket;
        socket.on('disconnect', function() {
            console.log('nsp psn$bedmonitor disconnect: ' + socket.id);
            delete self.socketClientsOfPSN$BedMonitor[socket.id];
        });
        socket.on(socketClientEvents.PSN.BED_MONITOR.SUBSCRIBE, function(data) {
            return co(function *() {
                try {
                    console.log(socketClientEvents.PSN.BED_MONITOR.SUBSCRIBE + ':' + socket.id + '  => data  ' +  JSON.stringify(data));
                    var bedMonitorNames = data.bedMonitorNames, tenantId = data.tenantId, bedMonitorName, bedMonitorStatus;
                    if (bedMonitorNames) {
                        console.log('bedMonitorNames ', bedMonitorNames);
                        for (var i = 0, len = bedMonitorNames.length; i < len; i++) {
                            socket.join('bedMonitor_' + bedMonitorNames[i]);
                        }
                        var bedMonitors = yield self.ctx.modelFactory().model_query(self.ctx.models['pub_bedMonitor'], {
                            select: 'name device_status',
                            where: {
                                status: 1,
                                name: { '$in': bedMonitorNames},
                                tenantId: tenantId
                            }
                        });
                        console.log('bedMonitors ', bedMonitors);
                        for (var i = 0, len = bedMonitors.length; i < len; i++) {
                            bedMonitorName = bedMonitors[i].name;
                            bedMonitorStatus = bedMonitors[i].device_status;
                            if(bedMonitorStatus === DIC.D3009.OffLine){
                                // self.sendToClient(socketServerEvents.PSN.BED_MONITOR.OFF_LINE, {bedMonitorName: bedMonitorName});
                                socket.emit(socketServerEvents.PSN.BED_MONITOR.OFF_LINE, {bedMonitorName: bedMonitorName});
                            } else if (bedMonitorStatus === DIC.D3009.OnLine) {
                                // self.sendToClient(socketServerEvents.PSN.BED_MONITOR.ON_LINE, {bedMonitorName: bedMonitorName});
                                socket.emit(socketServerEvents.PSN.BED_MONITOR.ON_LINE, {bedMonitorName: bedMonitorName});
                            }
                        }
                    }
                    console.log('PSN.BED_MONITOR.SUBSCRIBE finished')
                }
                catch (e) {
                    console.log(e);
                    self.logger.error(e.message);
                }
            }).catch(self.ctx.coOnError);
        });
    }
};