/**
 * district Created by zppro on 17-3-17.
 * Target:养老机构 模版计划
 */

(function() {
    'use strict';
    
    angular
        .module('subsystem.pension-agency')
        .controller('NursingPlanController', NursingPlanController)
    ;

    NursingPlanController.$inject = ['$scope', 'ngDialog', 'vmh', 'instanceVM'];

    function NursingPlanController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;

        init();

        function init() {

            vm.init({removeDialog: ngDialog});
 
            vm.onRoomChange = onRoomChange;
            vm.setElderlyNursingLevel = setElderlyNursingLevel;
            vm.doChangeElderlyNursingLevel = doChangeElderlyNursingLevel;
            vm.cancelElderlyEditing = cancelElderlyEditing;
            vm.serviceItemChecked = serviceItemChecked;
            vm.setNursingPlanRemark = setNursingPlanRemark;
            vm.saveNursingPlanRemark = saveNursingPlanRemark;
            vm.cancelNursingPlanRemark = cancelNursingPlanRemark;

            vm.tab1 = {cid: 'contentTab1'};
            vm.$editings = {};


            vmh.parallel([
                vmh.clientData.getJson('nursingPlanAxis'),
                vmh.shareService.d('D3006'),
                vmh.shareService.d('D3012')
            ]).then(function (results) {
                vm.xAxisData = results[0];
                vm.selectBinding.nursingLevels = results[1];
                var nursingItems = results[2];
                var nursingItemMap = {};
                for(var i=0,len = vm.selectBinding.nursingLevels.length;i< len;i++) {
                    var nursingLevel = vm.selectBinding.nursingLevels[i].value;
                    var nursingLevelCatalogPrefix = nursingLevel.substr(0, 2);
                    nursingItemMap[nursingLevel] = _.filter(nursingItems, function (o) {
                       return o.value.substr(0, 2) ===  nursingLevelCatalogPrefix;
                    });
                }
                vm.nursingItemMap = nursingItemMap;
                console.log(nursingItemMap);
            });

            vm.yAxisDataPromise = vmh.shareService.tmp('T3009', null, {tenantId:vm.tenantId}).then(function(nodes){
                console.log('yAxisDataPromise');
                // console.log(nodes);
                return nodes;
            });

            vm.service_items = {};
            fetchNursingPlan();
        }


        function fetchNursingPlan() {
            console.log('parse nursingPlanItems:');
            vmh.psnService.nursingPlansByRoom(vm.tenantId, ['name', 'sex', 'nursing_level'], ['elderlyId', 'service_items', 'remark']).then(function(data){
                vm.aggrData = data;
                for(var trackedKey in vm.aggrData) {
                    vm.$editings[trackedKey] = {};
                    var key = vm.aggrData[trackedKey]['elderly']['nursing_level'];
                    if (key) {
                        if (!vm.service_items[key]) {
                            vm.service_items[key] = {};
                        }
                        var nursingPlan = vm.aggrData[trackedKey]['nursing_plan'];
                        if (vm.aggrData[trackedKey]['nursing_plan']) {
                            var service_items = vm.aggrData[trackedKey]['nursing_plan']['service_items'];
                            if (service_items) {
                                for (var i = 0, len = service_items.length; i < len; i++) {
                                    vm.service_items[key][service_items[i]] = true;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        function onRoomChange () {
            console.log('onRoomChange');
            var yAxisDataFlatten = [];
            _.each(vm.yAxisData, function (o) {
                for (var i = 1, len = o.capacity; i <= len; i++) {
                    var trackedKey =  o._id + '$' + i;
                    yAxisDataFlatten.push(_.extend({trackedKey: trackedKey, bed_no: i}, o));

                }
            });
            vm.yAxisDataFlatten = yAxisDataFlatten;
        }

        function setElderlyNursingLevel (trackedKey) {
            vm.$editings[trackedKey]['elderly'] = true;
        }

        function doChangeElderlyNursingLevel (trackedKey, nursing_level) {
            var elderlyId = vm.aggrData[trackedKey]['elderly'].id;
            vmh.psnService.changeElderlyNursingLevel(vm.tenantId, elderlyId, nursing_level, vm.operated_by, vm.operated_by_name).then(function(data){
                vm.aggrData[trackedKey]['elderly'].nursing_level = data.nursing_level;
                vm.aggrData[trackedKey]['elderly'].nursing_level_name = data.nursing_level_name;
                vm.$editings[trackedKey]['elderly'] = false;
            });
        }

        function cancelElderlyEditing (trackedKey) {
            vm.$editings[trackedKey]['elderly'] = false;
        }

        function serviceItemChecked (trackedKey, nursingItemId) {
            var elderlyId = vm.aggrData[trackedKey]['elderly'].id;
            var nursing_item_check_info = { id: nursingItemId, checked: vm.service_items[vm.aggrData[trackedKey]['elderly']['nursing_level']][nursingItemId]};
            // console.log('serviceItemChecked:',nursingItemId, nursing_item_check_info);
            vmh.psnService.nursingPlanSave(vm.tenantId, elderlyId, nursing_item_check_info);
        }

        function setNursingPlanRemark (trackedKey) {
            vm.$editings[trackedKey]['remark'] = true;
        }

        function saveNursingPlanRemark (trackedKey, remark) {
            console.log('saveNursingPlanRemark=>', trackedKey, remark);

        }

        function cancelNursingPlanRemark (trackedKey) {
            vm.$editings[trackedKey]['remark'] = false;
        }
    }
})();