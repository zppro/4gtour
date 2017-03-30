/**
 * Created by zppro on 17-3-30.
 */
var co = require('co');
var socketClientEvents = require('../pre-defined/socket-client-events.json');
module.exports = {
    createChannel: function (ctx, ioSocket) {
        console.log('init socket$psn_bed_monitor component... ');
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
        this.addPSN$BedMonitorNamespace();
        console.log(this.filename + ' ready... ');
 
        return this;
    },
    addPSN$BedMonitorNamespace: function() {
        this.socketClientsOfPSN$BedMonitor = {};
        this.nspOfPSN$bed_monitor = this.ioSocket.of('/psn$bed_monitor');
        this.nspOfPSN$bed_monitor.on('connection', this.onPSN$BedMonitorConnection.bind(this));
    },
    sendPSN$BedMonitorEvent: function (bedMonitorName, eventName, eventData) {
        console.log('sendPSN$BedMonitorEvent with bedMonitor id: ' + 'bedMonitor_' + bedMonitorName);
        console.log('eventName: ' + eventName);
        console.log('reason: ' + eventData.reason);
        this.nspOfPSN$bed_monitor.to('bedMonitor_' + bedMonitorName).emit(eventName, eventData);
    },
    onPSN$BedMonitorConnection: function (socket) {
        var self = this;
        console.log('nsp member connection: ' + socket.id);
        self.socketClientsOfPSN$BedMonitor[socket.id] = socket;
        socket.on('disconnect', function() {
            console.log('nsp member disconnect: ' + socket.id);
            delete self.socketClientsOfPSN$BedMonitor[socket.id];
        });
        socket.on(socketClientEvents.PSN.BED_MONITOR.SUBSCRIBE, function(data) {
            return co(function *() {
                try {
                    console.log(socketClientEvents.PSN.BED_MONITOR.SUBSCRIBE + ':' + socket.id + '  => data  ' +  JSON.stringify(data));
                    var bedMonitorName = data;

                    socket.join('bedMonitor_' + bedMonitorName);

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