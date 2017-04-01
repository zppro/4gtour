/**=========================================================
 * Module: ModelProvider.js
 * Provides ModelService functions for node.js
 =========================================================*/
(function() {
    'use strict';
    angular
        .module('app.model')
        .provider('modelNode', ModelNode)
        .provider('shareNode', ShareNode)
        .provider('extensionNode', ExtensionNode)
        .provider('mwsNode', MWSNode)
        .provider('psnNode', PSNNode)
        .provider('psnDashboardNode', PSNDashboardNode)
        .provider('trvDashboardNode', TRVDashboardNode)
        .provider('idtNode',IDTNode)
        .provider('qiniuNode',QiniuNode)
        .provider('debugNode',DebugNode)
        .provider('clientData',ClientData)
    ;

    function ModelNode() {
        var baseUrl;
        return {
            // provider access level
            setBaseUrl: setBaseUrl,

            // controller access level
            $get: ['$resource', function ($resource) {
                return {
                    services: {},
                    factory: function (name) {
                        this.services[name] = $resource(baseUrl + name + '/:_id', {
                            _id: '@_id'
                        }, {
                            'get': {method: 'GET', headers: {'_$resource$_': true}},
                            'list': {method: 'GET', isArray: true, headers: {'_$resource$_': true}},
                            '_query': {method: 'POST', isArray: true, headers: {'_$resource$_': true}},
                            '_post': {method: 'POST', headers: {'_$resource$_': true}},
                            '_update': {method: 'PUT', headers: {'_$resource$_': true}},
                            '_save': {method: 'POST', headers: {'_$resource$_': true}},
                            '_remove': {method: 'DELETE', headers: {'_$resource$_': true}}
                            //'delete': {method: 'DELETE'}
                        });
                        this.services[name].save = function (params, successFn, errorFn) {
                            return this._save(null, params, successFn, errorFn)
                        };
                        this.services[name].update = function (_id, params, successFn, errorFn) {
                            return this._update({_id: _id}, params, successFn, errorFn)
                        };
                        this.services[name].disable = function (_id, successFn, errorFn) {
                            return this._update({_id: _id}, {status: 0}, successFn, errorFn);
                        };
                        this.services[name].remove = function (_id, successFn, errorFn) {
                            return this._remove({_id: _id}, null, successFn, errorFn);
                        };
                        this.services[name].one = function (params, successFn, errorFn) {
                            return this.get(_.extend(params, {_id: '$one'}), successFn, errorFn)
                        };
                        this.services[name].page = function (page, where, select, sort, populates, successFn, errorFn) {
                            return this._query({_id: '$query'}, {
                                page: page,
                                where: where,
                                select: select,
                                sort: sort,
                                populates: populates
                            }, successFn, errorFn);
                        };
                        this.services[name].query = function (where, select, sort, populates, successFn, errorFn) {
                            return this._query({_id: '$query'}, {
                                where: where,
                                select: select,
                                sort: sort
                            }, successFn, errorFn);
                        };
                        this.services[name].totals = function (where, successFn, errorFn) {
                            return this._post({_id: '$totals'}, where, successFn, errorFn)
                        };
                        this.services[name].bulkInsert = function (rows, removeWhere, successFn, errorFn) {
                            return this._post({_id: '$bulkInsert'}, {
                                removeWhere: removeWhere,
                                rows: rows
                            }, successFn, errorFn)
                        };
                        this.services[name].bulkUpdate = function (conditions,batchModel, successFn, errorFn) {
                            return this._post({_id: '$bulkUpdate'}, {
                                conditions: conditions,
                                batchModel: batchModel
                            }, successFn, errorFn)
                        };
                    }
                };
            }]
        };

        function setBaseUrl(url) {
            baseUrl = url;
        }
    }

    function ShareNode(){
        var baseUrl;
        return {
            // provider access level
            setBaseUrl: setBaseUrl,

            // controller access level
            $get: ['$q', '$http', 'treeFactory', function ($q, $http, treeFactory) {

                return {
                    shareDictionary: {},
                    shareTree: {},
                    d: function (id, forceRefresh) {
                        var promise;
                        if (forceRefresh || this.shareDictionary[id] == undefined) {
                            var self = this;
                            promise = $http.get(baseUrl + 'dictionary/' + id + '/array').then(function (rows) {
                                self.shareDictionary[id] = rows;
                                return self.shareDictionary[id];
                            });
                        }
                        else {
                            promise = $q.when(this.shareDictionary[id]);
                        }
                        return promise;
                    },
                    t: function (id, where, forceRefresh) {//tmg 本地过滤
                        var promise;
                        var cacheKey = 'get-'+id
                        if (forceRefresh || angular.isUndefined(this.shareTree[cacheKey])) {
                            var self = this;
                            promise = $http.get(baseUrl + 'tree/T/' + id).then(function (nodes) {
                                self.shareTree[cacheKey] = nodes;
                                return self.shareTree[cacheKey];
                            });
                        }
                        else {
                            promise = $q.when(this.shareTree[cacheKey]);
                        }

                        return where ? promise.then(function (nodes) {
                            var clone = angular.copy(nodes);
                            for (var key in where) {
                                treeFactory.filter(clone, function (node) {
                                    if (node[key]) {
                                        var filterData = where[key];
                                        if (_.isString(filterData)) {
                                            return node[key] == filterData;
                                        }
                                        else if (_.isArray(filterData)) {
                                            return _.contains(filterData, node[key]);
                                        }
                                    }
                                    return true;
                                });
                            }
                            return clone;
                        }) : promise;
                    },
                    tmg: function (id, select, where, forceRefresh) {//tmg 本地过滤
                        var promise;
                        var cacheKey = 'get-'+id
                        if (forceRefresh || angular.isUndefined(this.shareTree[cacheKey])) {
                            var self = this;
                            if (select && (select.indexOf('_id ') == -1 || select.indexOf(' _id') == -1)) {
                                select = '_id ' + select;
                            }
                            promise = $http.get(baseUrl + 'tree/' + id + '/' + (select || '_id name')).then(function (nodes) {
                                self.shareTree[cacheKey] = nodes;
                                return self.shareTree[cacheKey];
                            });
                        }
                        else {
                            promise = $q.when(this.shareTree[cacheKey]);
                        }

                        return where ? promise.then(function (nodes) {
                            var clone = angular.copy(nodes);
                            for (var key in where) {
                                treeFactory.filter(clone, function (node) {
                                    if (node[key]) {
                                        var filterData = where[key];
                                        if (_.isString(filterData)) {
                                            return node[key] == filterData;
                                        }
                                        else if (_.isArray(filterData)) {
                                            return _.contains(filterData, node[key]);
                                        }
                                    }
                                    return true;
                                });
                            }
                            return clone;
                        }) : promise;
                    },
                    tmp: function (id, select, where, forceRefresh) {//tmg 本地过滤
                        var promise;
                        var cacheKey = 'post-' + id + objectHash(where);
                        if (forceRefresh || angular.isUndefined(this.shareTree[cacheKey])) {
                            var self = this;
                            if (select && (select.indexOf('_id ') == -1 || select.indexOf(' _id') == -1)) {
                                select = '_id ' + select;
                            }
                            promise = $http.post(baseUrl + 'tree/' + id, {
                                where: where,
                                select: select
                            }).then(function (nodes) {
                                self.shareTree[cacheKey] = nodes;
                                return self.shareTree[cacheKey];
                            });
                        }
                        else {
                            promise = $q.when(this.shareTree[cacheKey]);
                        }

                        return promise;
                    }
                };
            }]
        };

        function setBaseUrl(url) {
            baseUrl = url;
        }
    }

    function ExtensionNode(){
        var baseUrl;
        return {
            // provider access level
            setBaseUrl: setBaseUrl,

            // controller access level
            $get: ['$http', function ($http) {

                return {
                    tenantInfo: tenantInfo,
                    tenantChargeItemCustomizedAsTree: tenantChargeItemCustomizedAsTree,
                    saveTenantChargeItemCustomized: saveTenantChargeItemCustomized,
                    queryVoucherNo: queryVoucherNo,
                    completeOrder: completeOrder,
                    refundOrder: refundOrder,
                    userChangePassword: userChangePassword,
                    resetUserPassword: resetUserPassword,
                    upgradeAppServerSide: upgradeAppServerSide,
                    upgradeAppClientSide: upgradeAppClientSide
                };

                function tenantInfo(tenantId,select) {
                    return $http.get(baseUrl + 'tenantInfo/' + tenantId + '/' + select);
                }

                function tenantChargeItemCustomizedAsTree(tenantId, charge_standard, subsystem){
                    return $http.get(baseUrl + 'tenantChargeItemCustomizedAsTree/' + tenantId + ',' + charge_standard + ',' + subsystem);
                }

                function saveTenantChargeItemCustomized(tenantId, chargeStandard) {
                    return $http.post(baseUrl + 'saveTenantChargeItemCustomized/' + tenantId, chargeStandard);
                }

                function queryVoucherNo(tenantId, modelName, keyword, where, select, sort){
                    return $http.post(baseUrl + 'q/voucher_no', {tenantId: tenantId, modelName: modelName, keyword: keyword,  data: {
                        where: where,
                        select: select,
                        sort: sort
                    }});
                }


                function completeOrder(orderId) {
                    return $http.post(baseUrl + 'completeOrder/' + orderId);
                }

                function refundOrder(orderId) {
                    return $http.post(baseUrl + 'refundOrder/' + orderId);
                }

                function userChangePassword(userId,data) {
                    return $http.post(baseUrl + 'userChangePassword/' + userId, data);
                }

                function resetUserPassword(userId) {
                    return $http.post(baseUrl + 'resetUserPassword/' + userId);
                }

                function upgradeAppServerSide(appId) {
                    return $http.post(baseUrl + 'upgradeAppServerSide/' + appId);
                }

                function upgradeAppClientSide(appId, os) {
                    return $http.post(baseUrl + 'upgradeAppClientSide/' + appId + ',' + os);
                }
            }]
        };

        function setBaseUrl(url) {
            baseUrl = url;
        }
    }

    function IDTNode(){
        var baseUrl;
        return {
            // provider access level
            setBaseUrl: setBaseUrl,

            // controller access level
            $get: ['$http', function ($http) {

                return {
                    PFT$fetchScenicSpotList: PFT$fetchScenicSpotList,
                    PFT$fetchTicket: PFT$fetchTicket,
                    PFT$syncScenicSpot: PFT$syncScenicSpot,
                    PFT$syncTicket: PFT$syncTicket,
                    PFT$issueTicket: PFT$issueTicket,
                    PFT$refundForTicket: PFT$refundForTicket,
                    PFT$refreshOrderInfo: PFT$refreshOrderInfo,
                    PFT$resendSmsForOrder: PFT$resendSmsForOrder,
                    saveIDCConfigItem: saveIDCConfigItem,
                    saveIDCConfigItems: saveIDCConfigItems
                };

                function PFT$fetchScenicSpotList() {
                    return $http.get(baseUrl + 'PFT$fetchScenicSpotList');
                }

                function PFT$fetchTicket(scenicSpotId){
                    return $http.get(baseUrl + 'PFT$fetchTicket/' + scenicSpotId);
                }

                function PFT$syncScenicSpot(){
                    return $http.post(baseUrl + 'PFT$syncScenicSpot');
                }

                function PFT$syncTicket(scenicSpotId) {
                    var params = scenicSpotId ? '/' + scenicSpotId : '';
                    return $http.post(baseUrl + 'PFT$syncTicket' + params);
                }

                function PFT$issueTicket(orderId) {
                    return $http.post(baseUrl + 'PFT$issueTicket/' + orderId);
                }

                function PFT$refundForTicket(orderId) {
                    return $http.post(baseUrl + 'PFT$refundForTicket/' + orderId);
                }

                function PFT$refreshOrderInfo(orderId) {
                    return $http.post(baseUrl + 'PFT$refreshOrderInfo/' + orderId);
                }

                function PFT$resendSmsForOrder(orderId) {
                    return $http.post(baseUrl + 'PFT$resendSmsForOrder/' + orderId);
                }

                function saveIDCConfigItem(idc_name, primary_key, primary_value, config_key, config_value) {
                    return $http.post(baseUrl + 'saveIDCConfigInfo', [{
                        where: {
                            idc_name: idc_name,
                            primary_key: primary_key,
                            primary_value: primary_value,
                            config_key: config_key
                        }, value: config_value
                    }]);
                }

                //items=>[{where:{idc_name: '...',primary_key: '...',primary_value: '...',config_key: '...'},value:'...'},{where:{...},value:''}]
                function saveIDCConfigItems(items) {
                    return $http.post(baseUrl + 'saveIDCConfigInfo', items);
                }
            }]
        };

        function setBaseUrl(url) {
            baseUrl = url;
        }
    }

    function MWSNode() {
        var baseUrl;
        return {
            // provider access level
            setBaseUrl: setBaseUrl,

            // controller access level
            $get: ['$http', function ($http) {

                return {
                    orderShip: orderShip,
                    spuPublish: spuPublish,
                    spuUnPublish: spuUnPublish,
                    afterSaleAccept: afterSaleAccept,
                    genWXAQRCode: genWXAQRCode,
                    accessTokens: accessTokens,
                    requestAccessToken: requestAccessToken
                };

                function orderShip(orderId, data) {
                    return $http.post(baseUrl + 'order/ship/' + orderId, data);
                }

                function spuPublish(spuId, data) {
                    return $http.post(baseUrl + 'spu/publish/' + spuId, data);
                }

                function spuUnPublish(spuId, data) {
                    return $http.post(baseUrl + 'spu/unpublish/' + spuId, data);
                }

                function afterSaleAccept(afterSaleId, data) {
                    return $http.post(baseUrl + 'afterSale/accept/' + afterSaleId, data);
                }

                function genWXAQRCode(channelUnitId, data) {
                    return $http.post(baseUrl + 'channelUnit/genWXAQRCode/' + channelUnitId, data);
                }

                function accessTokens(tenantId) {
                    return $http.get(baseUrl + 'accessTokens/' + tenantId);
                }

                function requestAccessToken(app_id) {
                    return $http.post(baseUrl + 'requestAccessToken', {appid: app_id});
                }

            }]
        };

        function setBaseUrl(url) {
            baseUrl = url;
        }
    }

    function PSNNode() {
        var baseUrl;
        return {
            // provider access level
            setBaseUrl: setBaseUrl,

            // controller access level
            $get: ['$http', function ($http) {

                return {
                    roomStatusInfo: roomStatusInfo,
                    updateRoomStatusInfo: updateRoomStatusInfo,
                    robotRemoveRoomConfig: robotRemoveRoomConfig,
                    bedMonitorRemoveRoomConfig: bedMonitorRemoveRoomConfig,
                    submitApplicationToExit: submitApplicationToExit,
                    submitToAuditItemReturn: submitToAuditItemReturn,
                    submitToAuditSettlement: submitToAuditSettlement,
                    submitToConfirmExit: submitToConfirmExit,
                    advancePaymentItemsWhenExitSettlement: advancePaymentItemsWhenExitSettlement,
                    chargeItemsRecordedWhenExitSettlement: chargeItemsRecordedWhenExitSettlement,
                    chargeItemsUnRecordedWhenExitSettlement: chargeItemsUnRecordedWhenExitSettlement,
                    exitSettlement: exitSettlement,
                    completeExit: completeExit,
                    completeEnter: completeEnter,
                    disableEnterRelatedAction: disableEnterRelatedAction,
                    checkBeforeAddEnter: checkBeforeAddEnter,
                    queryElderly: queryElderly,
                    queryDrug:queryDrug,
                    elderlyInfo: elderlyInfo,
                    changeElderlyRoomBed: changeElderlyRoomBed,
                    changeElderlyChargeItem: changeElderlyChargeItem,
                    changeElderlyChargeItemForOtherAndCustomized: changeElderlyChargeItemForOtherAndCustomized,
                    changeElderlyNursingLevel: changeElderlyNursingLevel,
                    receptionVisiterSyncElderlyFamilyMembers: receptionVisiterSyncElderlyFamilyMembers,
                    leaveAccompanierSyncElderlyFamilyMembers: leaveAccompanierSyncElderlyFamilyMembers,
                    drugInStock:drugInStock,
                    drugOutStock:drugOutStock,
                    drugOutStockInvalid:drugOutStockInvalid,
                    checkCanChangeBookingOrUnbookingRecharge: checkCanChangeBookingOrUnbookingRecharge,
                    bookingRecharge: bookingRecharge,
                    disableRechargeAndUnbooking: disableRechargeAndUnbooking,
                    changeRechargeBookingAmount: changeRechargeBookingAmount,
                    checkCanBookingRedToElderlyRecharge: checkCanBookingRedToElderlyRecharge,
                    bookingRedToElderlyRecharge: bookingRedToElderlyRecharge,
                    checkCanChangeBookingOrUnbookingRedToElderlyRecharge: checkCanChangeBookingOrUnbookingRedToElderlyRecharge,
                    disableRedAndUnbookingToElderlyRecharge: disableRedAndUnbookingToElderlyRecharge,
                    changeRedBookingAmountToElderlyRecharge: changeRedBookingAmountToElderlyRecharge,
                    nursingScheduleWeekly: nursingScheduleWeekly,
                    nursingScheduleSave: nursingScheduleSave,
                    nursingScheduleRemove: nursingScheduleRemove,
                    nursingScheduleTemplateImport: nursingScheduleTemplateImport,
                    nursingScheduleSaveAsTemplateWeekly: nursingScheduleSaveAsTemplateWeekly,
                    nursingPlansByRoom: nursingPlansByRoom,
                    nursingPlanSaveWorkItem: nursingPlanSaveWorkItem,
                    nursingPlanSaveRemark: nursingPlanSaveRemark,
                    nursingRecordGenerate: nursingRecordGenerate,
                    elderlysByDistrictFloors: elderlysByDistrictFloors
                };

                function roomStatusInfo(tenantId) {
                    return $http.get(baseUrl + 'roomStatusInfo/' + tenantId);
                }

                function updateRoomStatusInfo(tenantId,roomId,bed_no,elderlyId) {
                    return $http.post(baseUrl + 'updateRoomStatusInfo', {
                        tenantId: tenantId,
                        roomId: roomId,
                        bed_no: bed_no,
                        elderlyId: elderlyId
                    });
                }

                function robotRemoveRoomConfig(tenantId, robotId) {
                    return $http.post(baseUrl + 'robotRemoveRoomConfig', {
                        tenantId: tenantId,
                        robotId: robotId
                    });
                }

                function bedMonitorRemoveRoomConfig(tenantId, bedMonitorId) {
                    return $http.post(baseUrl + 'bedMonitorRemoveRoomConfig', {
                        tenantId: tenantId,
                        bedMonitorId: bedMonitorId
                    });
                }

                function submitApplicationToExit(elderlyId,data) {
                    return $http.post(baseUrl + 'submitApplicationToExit/' + elderlyId, data);
                }

                function submitToAuditItemReturn(exitId){
                    return $http.post(baseUrl + 'submitToAuditItemReturn/' + exitId);
                }

                function submitToAuditSettlement(exitId,data){
                    return $http.post(baseUrl + 'submitToAuditSettlement/' + exitId, data);
                }

                function submitToConfirmExit(exitId,data){
                    return $http.post(baseUrl + 'submitToConfirmExit/' + exitId, data);
                }

                function advancePaymentItemsWhenExitSettlement(exitId){
                    return $http.get(baseUrl + 'advancePaymentItemsWhenExitSettlement/' + exitId);
                }

                function chargeItemsRecordedWhenExitSettlement(exitId){
                    return $http.get(baseUrl + 'chargeItemsRecordedWhenExitSettlement/' + exitId);
                }

                function chargeItemsUnRecordedWhenExitSettlement(exitId){
                    return $http.get(baseUrl + 'chargeItemsUnRecordedWhenExitSettlement/' + exitId);
                }

                function exitSettlement(exitId,data) {
                    return $http.post(baseUrl + 'exitSettlement/' + exitId, data);
                }

                function completeExit(exitId, data) {
                    return $http.post(baseUrl + 'completeExit/' + exitId, data);
                }

                function completeEnter(enterId, data) {
                    return $http.post(baseUrl + 'completeEnter/' + enterId, data);
                }

                function disableEnterRelatedAction(enterId){
                    return $http.post(baseUrl + 'disableEnterRelatedAction/' + enterId);
                }

                function checkBeforeAddEnter(id_no,tenantId) {
                    return $http.get(baseUrl + 'checkBeforeAddEnter/' + tenantId + '/' + id_no);
                }

                function queryElderly(tenantId,keyword,where,select,sort) {
                    return $http.post(baseUrl + 'q/elderly', {tenantId: tenantId, keyword: keyword,  data: {
                        where: where,
                        select: select,
                        sort: sort
                    }});
                }

                function queryDrug(tenantId,keyword,where,select,sort) {
                    return $http.post(baseUrl + 'q/drug', {tenantId: tenantId, keyword: keyword,  data: {
                        where: where,
                        select: select,
                        sort: sort
                    }});
                }

                function drugOutStockInvalid(drugInOutStockId){
                    return $http.post(baseUrl + 'drugOutStockInvalid', {drugInOutStockId: drugInOutStockId});
                }

                function elderlyInfo(elderlyId,select) {
                    return $http.get(baseUrl + 'elderlyInfo/' + elderlyId + '/' + select);
                }

                function changeElderlyRoomBed(tenantId,elderlyId,roomId,bed_no) {
                    return $http.post(baseUrl + 'changeElderlyRoomBed', {
                        tenantId: tenantId,
                        elderlyId: elderlyId,
                        roomId: roomId,
                        bed_no: bed_no
                    });
                }

                function changeElderlyChargeItem(tenantId,elderlyId,charge_item_catalog_id,old_charge_item_id,new_charge_item) {
                    return $http.post(baseUrl + 'changeElderlyChargeItem', {
                        tenantId: tenantId,
                        elderlyId: elderlyId,
                        charge_item_catalog_id: charge_item_catalog_id,
                        old_charge_item_id: old_charge_item_id,
                        new_charge_item: new_charge_item
                    });
                }

                function changeElderlyChargeItemForOtherAndCustomized(tenantId,elderlyId,charge_item_catalog_id,selectedOtherAndCustomized){
                    return $http.post(baseUrl + 'changeElderlyChargeItemForOtherAndCustomized', {
                        tenantId: tenantId,
                        elderlyId: elderlyId,
                        charge_item_catalog_id: charge_item_catalog_id,
                        selectedOtherAndCustomized: selectedOtherAndCustomized
                    });
                }

                function changeElderlyNursingLevel(tenantId, elderlyId, nursingLevelId, operated_by, operated_by_name) {
                    return $http.post(baseUrl + 'changeElderlyNursingLevel', {tenantId: tenantId, elderlyId: elderlyId, nursingLevelId: nursingLevelId, operated_by: operated_by, operated_by_name: operated_by_name});
                }

                function receptionVisiterSyncElderlyFamilyMembers(receptionId) {
                    return $http.post(baseUrl + 'receptionVisiterSyncElderlyFamilyMembers/' + receptionId);
                }

                function leaveAccompanierSyncElderlyFamilyMembers(leaveId){
                    return $http.post(baseUrl + 'leaveAccompanierSyncElderlyFamilyMembers/' + leaveId);
                }

                function drugInStock(tenantId,elderlyId,elderly_name,drugId,drug_no,drug_full_name,in_out_quantity,type,unit){
                     return $http.post(baseUrl + 'inStock', {tenantId: tenantId, elderlyId: elderlyId,elderly_name:elderly_name,drugId: drugId,drug_no:drug_no,drug_full_name:drug_full_name,in_out_quantity:in_out_quantity,type: type, unit: unit});
                }
                 function drugOutStock(tenantId,elderlyId,drugId,in_out_quantity,type,unit){
                     return $http.post(baseUrl + 'outStock', {tenantId: tenantId, elderlyId: elderlyId, drugId: drugId,in_out_quantity:in_out_quantity,type: type, unit: unit});
                }

                function checkCanChangeBookingOrUnbookingRecharge(rechargeId){
                    return $http.get(baseUrl + 'checkCanChangeBookingOrUnbookingRecharge/' + rechargeId);
                }

                function bookingRecharge(rechargeId,data){
                    return $http.post(baseUrl + 'bookingRecharge/' + rechargeId, data);
                }

                function disableRechargeAndUnbooking(rechargeId,data){
                    return $http.post(baseUrl + 'disableRechargeAndUnbooking/' + rechargeId, data);
                }

                function changeRechargeBookingAmount(rechargeId,data){
                    return $http.post(baseUrl + 'changeRechargeBookingAmount/' + rechargeId, data);
                }
                
                function checkCanBookingRedToElderlyRecharge(data) {
                    return $http.post(baseUrl + 'checkCanBookingRedToElderlyRecharge', data);
                }

                function bookingRedToElderlyRecharge(data){
                    return $http.post(baseUrl + 'bookingRedToElderlyRecharge', data);
                }

                function checkCanChangeBookingOrUnbookingRedToElderlyRecharge(redId){
                    return $http.get(baseUrl + 'checkCanChangeBookingOrUnbookingRedToElderlyRecharge/' + redId);
                }

                function disableRedAndUnbookingToElderlyRecharge(redId,data){
                    return $http.post(baseUrl + 'disableRedAndUnbookingToElderlyRecharge/' + redId, data);
                }

                function changeRedBookingAmountToElderlyRecharge(redId,data){
                    return $http.post(baseUrl + 'changeRedBookingAmountToElderlyRecharge/' + redId, data);
                }

                function nursingScheduleWeekly(tenantId, start, end) {
                    return $http.post(baseUrl + 'nursingScheduleWeekly', {
                        tenantId: tenantId,
                        x_axis_range_points: {
                            start: start,
                            end: end
                        }
                    });
                }

                function nursingScheduleSave(tenantId, toSaveRows) {
                    return $http.post(baseUrl + 'nursingScheduleSave', {tenantId: tenantId, toSaveRows: toSaveRows});
                }

                function nursingScheduleRemove(tenantId, toRemoveRows) {
                    return $http.post(baseUrl + 'nursingScheduleRemove', {tenantId: tenantId, toRemoveRows: toRemoveRows});
                }

                function nursingScheduleTemplateImport(nursingScheduleTemplateId, toImportXAxisRange) {
                    return $http.post(baseUrl + 'nursingScheduleTemplateImport', {nursingScheduleTemplateId: nursingScheduleTemplateId, toImportXAxisRange: toImportXAxisRange});
                }

                function nursingScheduleSaveAsTemplateWeekly (tenantId, nursingScheduleTemplateName, toSaveRows) {
                    return $http.post(baseUrl + 'nursingScheduleSaveAsTemplateWeekly', {tenantId: tenantId, nursingScheduleTemplateName: nursingScheduleTemplateName, toSaveRows: toSaveRows});
                }

                function nursingPlansByRoom (tenantId, elderlySelectArray, nursingPlanSelectArray) {
                    return $http.post(baseUrl + 'nursingPlansByRoom', {tenantId: tenantId, elderlySelectArray: elderlySelectArray, nursingPlanSelectArray: nursingPlanSelectArray});
                }

                function nursingPlanSaveWorkItem(tenantId, elderlyId, work_item_check_info) {
                    return $http.post(baseUrl + 'nursingPlanSaveWorkItem', {tenantId: tenantId, elderlyId: elderlyId, work_item_check_info: work_item_check_info});
                }

                function nursingPlanSaveRemark(tenantId, elderlyId, remark) {
                    return $http.post(baseUrl + 'nursingPlanSaveRemark', {tenantId: tenantId, elderlyId: elderlyId, remark: remark});
                }

                function nursingRecordGenerate(tenantId, elderlyId) {
                    return $http.post(baseUrl + 'nursingRecordGenerate', {tenantId: tenantId, elderlyId: elderlyId});
                }
                
                function elderlysByDistrictFloors(tenantId, districtFloors) {
                    return $http.post(baseUrl + 'elderlysByDistrictFloors', {tenantId: tenantId, districtFloors: districtFloors});
                }
            }]
        };

        function setBaseUrl(url) {
            baseUrl = url;
        }
    }
    
    function PSNDashboardNode(){
        var baseUrl;
        return {
            // provider access level
            setBaseUrl: setBaseUrl,

            // controller access level
            $get: ['$http', function ($http) {

                return {
                    liveIn: liveIn,
                    liveInOnCurrentMonth: liveInOnCurrentMonth,
                    liveInManTime: liveInManTime,
                    tenantAccountInfo: tenantAccountInfo,
                    bedInfo: bedInfo,
                    liveinAndAccountAndBedInfo:liveinAndAccountAndBedInfo,
                    elderlyAgeGroups: elderlyAgeGroups,
                    roomVacancyRateMonthly: roomVacancyRateMonthly,
                    roomCatagoryOfManTime: roomCatagoryOfManTime,
                    roomCatagoryOfManTimeMonthly: roomCatagoryOfManTimeMonthly
                };

                function liveIn(tenantId) {
                    return $http.get(baseUrl + 'liveIn/' + tenantId);
                }

                function liveInOnCurrentMonth(tenantId){
                    return $http.get(baseUrl + 'liveInOnCurrentMonth/' + tenantId);
                }

                function liveInManTime(tenantId){
                    return $http.get(baseUrl + 'liveInManTime/' + tenantId);
                }
                
                function tenantAccountInfo(tenantId){
                    return $http.get(baseUrl + 'tenantAccountInfo/' + tenantId);
                }

                function bedInfo(tenantId){
                    return $http.get(baseUrl + 'bedInfo/' + tenantId);
                }

                function liveinAndAccountAndBedInfo(tenantId){
                    return $http.get(baseUrl + 'liveinAndAccountAndBedInfo/' + tenantId);
                }

                function elderlyAgeGroups(tenantId){
                    return $http.get(baseUrl + 'elderlyAgeGroups/' + tenantId+'/60/10');
                }

                function roomVacancyRateMonthly(tenantId,start,end) {
                    return $http.get(baseUrl + 'roomVacancyRateMonthly/' + tenantId + '/' + start + '/' + end);
                }

                function roomCatagoryOfManTime(tenantId){
                    return $http.get(baseUrl + 'roomCatagoryOfManTime/' + tenantId);
                }

                function roomCatagoryOfManTimeMonthly(tenantId,start,end){
                    return $http.get(baseUrl + 'roomCatagoryOfManTimeMonthly/' + tenantId+ '/' + start + '/' + end);
                }
            }]
        };

        function setBaseUrl(url) {
            baseUrl = url;
        }
    }

    function TRVDashboardNode(){
        var baseUrl;
        return {
            // provider access level
            setBaseUrl: setBaseUrl,

            // controller access level
            $get: ['$http', function ($http) {

                return {
                    getDeviceStatInfo: getDeviceStatInfo
                };

                function getDeviceStatInfo() {
                    return $http.get(baseUrl + 'deviceStatInfo');
                }

            }]
        };

        function setBaseUrl(url) {
            baseUrl = url;
        }
    }

    function QiniuNode(){
        var baseUrl;
        return {
            // provider access level
            setBaseUrl: setBaseUrl,

            // controller access level
            $get: ['$http', function ($http) {

                return {
                    uploadToken: uploadToken,
                    upload: upload,
                    download: download,
                    download2: download2
                };

                function uploadToken(user,bucket,key) {
                    if (!bucket) {
                        return null;
                    }

                    if(!user){
                        user = 'admin@local'
                    }

                    if (!key) {
                        key = '';
                    }

                    return $http.get(baseUrl + 'uploadToken/' + user + ',' + bucket + ',' + key);
                }
                
                function upload() {
                    return $http.post(baseUrl + 'upload');
                }

                function download(downloadUrl, fileName) {
                    if(!downloadUrl) return false;
                    var xhr = new XMLHttpRequest();
                    xhr.open('get', downloadUrl, true);
                    xhr.responseType = 'blob';
                    xhr.onload = function() {
                        // 注意这里的this.response 是一个blob对象 就是文件对象
                        if (this.status == 200) {
                            saveAs(this.response, fileName);
                        }
                    }
                    xhr.send();
                    return true;
                }

                function download2(downloadUrl, fileName) {
                    return $http.post(baseUrl + 'download', {downloadUrl: downloadUrl}, {responseType: 'blob'}).success(function (res){
                        saveAs(res, decodeURI(fileName || downloadUrl));
                    });
                }

                var loadImageToBlob  = function(url, callback) {
                    if(!url || !callback) return false;

                    var xhr = new XMLHttpRequest();

                    xhr.open('get', url, true);

                    xhr.responseType = 'blob';

                    xhr.onload = function() {

                        // 注意这里的this.response 是一个blob对象 就是文件对象

                        callback(this.status == 200 ? this.response : false);

                    }
                    xhr.send();
                    return true;

                }
            }]
        };

        function setBaseUrl(url) {
            baseUrl = url;
        }
    }

    function DebugNode() {
        var baseUrl;
        return {
            // provider access level
            setBaseUrl: setBaseUrl,

            // controller access level
            $get: ['$http', function ($http) {

                return {
                    tenantInfo: tenantInfo
                };

                function tenantInfo(tenantId, select) {
                    return $http.get(baseUrl + 'tenantInfo/' + tenantId + '/' + select);
                }
            }]
        };

        function setBaseUrl(url) {
            baseUrl = url;
        }
    }

    function ClientData() {
        var baseUrl;

        function setBaseUrl(url) {
            baseUrl = url;
        }

        return {
            // provider access level
            setBaseUrl: setBaseUrl,

            // controller access level
            $get: ['$http', function ($http) {

                return {
                    getJson: function (name) {
                        var arr = name.split('.');
                        if (arr[arr.length - 1] != 'json') {
                            name += '.json'
                        }
                        var promise = $http.get(baseUrl + name).then(function(res){
                            // console.log('----------------get json')
                            // console.log(res.data);
                            return res.data;
                        });
                        return promise;
                    }
                };
            }]
        };
    }


})();