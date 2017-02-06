/**
 * Created by zppro on 17-2-5.
 * Target:web商城 渠道
 */

(function() {
    'use strict';

    angular
        .module('subsystem.merchant-webstore.after-sale',[])
        .controller('MWS_ChannelUnitGridController', MWS_ChannelUnitGridController)
        .controller('MWS_ChannelUnitWXAQRCodeDialogController', MWS_ChannelUnitWXAQRCodeDialogController)
        .controller('NWS_ChannelUnitDetailsController', NWS_ChannelUnitDetailsController)
    ;


    MWS_ChannelUnitGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function MWS_ChannelUnitGridController($scope, ngDialog, vmh, vm) {
        $scope.vm = vm;
        $scope.utils = vmh.utils.g; 

        init();

        function init() {
            vm.init({removeDialog: ngDialog});

            vm.openDialogWXAQRCode = openDialogWXAQRCode;

            vm.conditionBeforeQuery = function () {
                if($scope.$stateParams.parentId) {
                    vm.searchForm = _.extend(vm.searchForm, {$or: [{parentId: $scope.$stateParams.parentId}, {_id: $scope.$stateParams.parentId}]});

                    console.log(vm.searchForm);
                }
            }

            if (vm.switches.leftTree) {
                vmh.fetch(vm.modelService.query({status: 1, tenantId: vm.tenantId, type: 'A0001'}, 'name')).then(function (rows) {
                    var treeNodes = _.map(rows,function(row){
                        return {_id:row.id,name:row.name};
                    });
                    treeNodes.unshift({_id: '', name:'全部'});
                    vm.trees = [new vmh.treeFactory.sTree('tree1', treeNodes, {mode: 'grid'})];
                    vm.trees[0].selectedNode = vm.trees[0].findNodeById($scope.$stateParams.parentId);
                });

                $scope.$on('tree:node:select', function ($event, node) {
                    var selectNodeId = node._id;
                    if ($scope.$stateParams.parentId != selectNodeId) {
                        $scope.$state.go(vm.viewRoute(), {parentId: selectNodeId});
                    }
                });
            }
            vm.query();
        }

        function openDialogWXAQRCode(row) {
            ngDialog.open({
                template: 'dlg-channel-unit-qrcode.html',
                controller: 'MWS_ChannelUnitWXAQRCodeDialogController',
                scope: $scope,
                resolve: {
                    vmh: function () {
                        return vmh;
                    },
                    channelUnit: function() {
                        return row;
                    }
                }
            });
        }
    }

    MWS_ChannelUnitWXAQRCodeDialogController.$inject = ['$scope', 'qiniuNode', 'vmh', 'channelUnit'];
    function MWS_ChannelUnitWXAQRCodeDialogController($scope, qiniuNode, vmh, channelUnit) {
        var vm = $scope.vm;
        $scope.utils = vmh.utils.v;
        init();

        function init() {
            vm.model = channelUnit;
            vm.doSubmit = doSubmit;
            vm.downloadQRCode = downloadQRCode;
        }
        function doSubmit() {
            if ($scope.theForm.$valid) {
                vmh.mwsService.genWXAQRCode(vm.model.id, vm.model).then(function(ret){
                    vmh.alertSuccess('notification.NORMAL-SUCCESS', true);
                    vm.model.wxa_qrcode = ret;
                });
            }
        }
        function downloadQRCode() {
            if(!vm.model.wxa_qrcode) {
                vmh.alertWarning('地址不存在');
                return;
            }

            //var file = new File(["Hello, world!"], "hello world.txt", {type: "text/plain;charset=utf-8"});
            // saveAs(file);
            // loadImageToBlob(vm.model.wxa_qrcode, function (blob) {
            //     saveAs(blob, decodeURI(vm.model.name + '.jpg'));
            // });
            qiniuNode.download(vm.model.wxa_qrcode, vm.model.name + '.jpg');
        }

        
    }

    NWS_ChannelUnitDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function NWS_ChannelUnitDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;


        init();

        function init() {

            vm.init({removeDialog: ngDialog});

            vm.doSubmit = doSubmit;
            vm.tab1 = {cid: 'contentTab1', active: true};

            vmh.fetch(vm.modelService.query({status: 1, tenantId: vm.tenantId, type: 'A0001'}, 'name')).then(function (rows) {
                console.log(rows);
                rows.unshift({id: null, name: '无'})
                vm.selectBinding.channelUnitAgents = rows;

                vm.registerFieldConverter('parentId', fieldConvertToParentId);

            });
            vmh.shareService.d('MWS08').then(function (rows) {
                vm.selectBinding.channelUnitTypes = rows;
            });

            vm.load();

        }

        function fieldConvertToParentId() {
            var channelUnitAgent = _.findWhere(vm.selectBinding.channelUnitAgents, {_id: vm.model.parentId});
            return (channelUnitAgent || {}).name || vm.model.parentId;
        }

        function doSubmit() {
            if ($scope.theForm.$valid) {
                if (vm.finish_flag) {
                    ngDialog.openConfirm({
                        template: 'customConfirmDialog.html',
                        className: 'ngdialog-theme-default',
                        controller: ['$scope', function ($scopeConfirm) {
                            $scopeConfirm.message = vm.viewTranslatePath('SUBMIT-FINISH-CONFIRM-MESSAGE')
                        }]
                    }).then(function () {
                        vm.model.biz_status = 'A0005';
                        vm.save();
                    });
                } else {
                    vm.save();
                }
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
            }
        }
    }
    
})();
