/**
 * Created by zppro on 16-11-11.
 */

module.exports = {
    formatWeiXinError: function (weixinError) {
        return {code: weixinError.errcode, message: weixinError.errmsg};
    },
    formatWeiXinResult: function (weixinResult) {
        if (weixinResult.errcode && weixinResult.errmsg) {
            return {code: weixinResult.errcode, message: weixinResult.errmsg};
        }
        else {
            return weixinResult;
        }
    }
};