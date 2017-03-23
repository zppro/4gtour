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
            vm.nursingCatalogChecked = nursingCatalogChecked;
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
                var nursingCatalogs = results[2];
                var nursingCatalogMap = {};
                for(var i=0,len = vm.selectBinding.nursingLevels.length;i< len;i++) {
                    var nursingLevel = vm.selectBinding.nursingLevels[i].value;
                    var nursingLevelCatalogPrefix = nursingLevel.substr(0, 2);
                    nursingCatalogMap[nursingLevel] = _.filter(nursingCatalogs, function (o) {
                       return o.value.substr(0, 2) ===  nursingLevelCatalogPrefix;
                    });
                }
                vm.nursingCatalogMap = nursingCatalogMap;
                console.log(nursingCatalogMap);
            });

            vm.yAxisDataPromise = vmh.shareService.tmp('T3009', null, {tenantId:vm.tenantId}).then(function(nodes){
                console.log('yAxisDataPromise');
                // console.log(nodes);
                return nodes;
            });

            vm.nursing_catalogs = {};
            fetchNursingPlan();
        }


        function fetchNursingPlan() {
            console.log('parse nursingPlanCatalogs:');
            vmh.psnService.nursingPlansByRoom(vm.tenantId, ['name', 'sex', 'nursing_level'], ['elderlyId', 'nursing_catalogs', 'remark']).then(function(data){
                vm.aggrData = data;
                for(var trackedKey in vm.aggrData) {
                    vm.$editings[trackedKey] = {};
                    var key = vm.aggrData[trackedKey]['elderly']['nursing_level'];
                    if (key) {
                        if (!vm.nursing_catalogs[key]) {
                            vm.nursing_catalogs[key] = {};
                        }
                        var nursingPlan = vm.aggrData[trackedKey]['nursing_plan'];
                        if (vm.aggrData[trackedKey]['nursing_plan']) {
                            var nursing_catalogs = vm.aggrData[trackedKey]['nursing_plan']['nursing_catalogs'];
                            if (nursing_catalogs) {
                                for (var i = 0, len = nursing_catalogs.length; i < len; i++) {
                                    vm.nursing_catalogs[key][nursing_catalogs[i]] = true;
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

        function nursingCatalogChecked (trackedKey, nursingCatalogId) {
            var elderlyId = vm.aggrData[trackedKey]['elderly'].id;
            var nursing_catalog_check_info = { id: nursingCatalogId, checked: vm.nursing_catalogs[vm.aggrData[trackedKey]['elderly']['nursing_level']][nursingCatalogId]};
            vmh.psnService.nursingPlanSaveNursingCatalog(vm.tenantId, elderlyId, nursing_catalog_check_info);
        }

        function setNursingPlanRemark (trackedKey) {
            vm.$editings[trackedKey]['remark'] = true;
        }

        function saveNursingPlanRemark (trackedKey, remark) {
            var elderlyId = vm.aggrData[trackedKey]['elderly'].id;
            vmh.psnService.nursingPlanSaveRemark(vm.tenantId, elderlyId, remark).then(function(data){
                vm.aggrData[trackedKey]['nursing_plan']['remark'] = remark;
                vm.$editings[trackedKey]['remark'] = false;
            });;
        }

        function cancelNursingPlanRemark (trackedKey) {
            vm.$editings[trackedKey]['remark'] = false;
        }
    }
})();