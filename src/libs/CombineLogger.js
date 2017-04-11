/**
 * Created by zppro on 17-04-11.
 * 合并日志输出
 */

module.exports = {
    log: function (logger) {
        var paramArray = Array.prototype.slice.call(arguments, 1);
        console.log.apply(null, paramArray);
        logger.debug.apply(logger, paramArray)
    },
    info: function (logger) {
        var paramArray = Array.prototype.slice.call(arguments, 1);
        console.log.apply(null, paramArray);
        logger.info.apply(logger, paramArray)
    },
    error: function (logger) {
        var paramArray = Array.prototype.slice.call(arguments, 1);
        console.log.apply(null, paramArray);
        logger.error.apply(logger, paramArray)
    }
};