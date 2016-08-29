/**
 * Created by zppro on 16-7-12.
 * Target:外出管理
 */

(function() {
    'use strict';

    angular
        .module('subsystem.organization-pfta')
        .controller('LeaveManageGridController', LeaveManageGridController)
        .controller('LeaveManageDetailsController', LeaveManageDetailsController)
    ;


    LeaveManageGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function LeaveManageGridController($scope, ngDialog, vmh, vm) {
        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();


        function init() {
            vm.init({removeDialog: ngDialog});

            vm.query();
        }

    }

    LeaveManageDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function LeaveManageDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;


        init();

        function init() {

            vm.init({removeDialog: ngDialog});

            vmh.shareService.d('D1001').then(function (rows) {
                vm.selectBinding.roles = _.initial(rows);
            });



            vm.doSubmit = doSubmit;
            vm.clearEndOn = clearEndOn;
            vm.queryElderly = queryElderly;
            vm.selectElerly = selectElerly;
            vm.tab1 = {cid: 'contentTab1'};

            vmh.parallel([
                vmh.shareService.d('D1006'),
                vmh.shareService.d('D1012')
            ]).then(function (results) {
                vm.selectBinding.sex = results[0];
                vm.selectBinding.relationsWithTheElderly = results[1];
            });

            vm.load().then(function(){
                if(vm.model.elderlyId){
                    vm.selectedElderly = {_id: vm.model.elderlyId, name: vm.model.elderly_name};
                }
            });

        }

        function clearEndOn() {
            vm.model.end_on = null;
        }

        function queryElderly(keyword) {
            return vmh.fetch(vmh.extensionService.queryElderly(vm.tenantId, keyword, {
                live_in_flag: true,
                begin_exit_flow: {'$in':[false,undefined]}
            }, 'name enter_code'));
        }

        function selectElerly(o) {
            if(o){
                vm.model.enter_code = o.originalObject.enter_code;
                vm.model.elderlyId = o.originalObject._id;
                vm.model.elderly_name = o.title;
            }
        }


        function doSubmit() {

            if ($scope.theForm.$valid) {
                vm.save(true).then(function(ret){
                    vmh.pftaOrgService.leaveAccompanierSyncElderlyFamilyMembers(vm.model._id||ret._id).then(function (ret) {
                        vmh.alertSuccess(vm.viewTranslatePath('SYNC_FAMILY_MEMBERS_SUCCESS'), true);
                        vm.returnBack();
                    });
                });
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
            }
        }
    }

})();
