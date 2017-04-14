/**
 * room Created by zppro on 17-3-23.
 * Target:养老机构工作项目
 */

(function() {
    'use strict';

    angular
        .module('subsystem.pension-agency')
        .controller('WorkItemGridController', WorkItemGridController)
        .controller('WorkItemDetailsController', WorkItemDetailsController)
    ;


    WorkItemGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function WorkItemGridController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();

        function init() {
            vm.init({removeDialog: ngDialog});

            if (vm.switches.leftTree) {
                vmh.shareService.tmp('T3001/psn-nursingLevel', 'name', vm.treeFilterObject).then(function (rows) {
                    var treeNodes = _.map(rows,function(row){return row});
                    treeNodes.unshift({_id: '', name:'全部'});
                    vm.trees = [new vmh.treeFactory.sTree('tree1', treeNodes, {mode: 'grid'})];
                    vm.trees[0].selectedNode = vm.trees[0].findNodeById($scope.$stateParams.nursingLevelId);
                });

                $scope.$on('tree:node:select', function ($event, node) {
                    var selectNodeId = node._id;
                    if ($scope.$stateParams.nursingLevelId != selectNodeId) {
                        $scope.$state.go(vm.viewRoute(), {nursingLevelId: selectNodeId});
                    }
                });
            }

            vm.query();
        }
    }

    WorkItemDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function WorkItemDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;


        init();

        function init() {

            vm.init({removeDialog: ngDialog});
              
            vm.doSubmit = doSubmit;

            vm.tab1 = {cid: 'contentTab1'};

            vmh.parallel([
                vmh.shareService.tmp('T3001/psn-nursingLevel', 'name', vm.treeFilterObject),
                vmh.shareService.d('D0103'),
                vmh.shareService.d('D0104')
            ]).then(function (results) {
                vm.selectBinding.nursingLevels = _.map(results[0],function(row){return {id: row._id, name: row.name }});
                vm.selectBinding.repeatTypes = results[1];
                vm.selectBinding.remindModes = results[2];
            });

            vm.load().then(function(){
                if(vm.model.repeat_values && vm.model.repeat_values.length > 0){
                    vm.repeat_values = vm.model.repeat_values.join();
                }
            });
        }

        function doSubmit() {
            vm.model.repeat_values = vm.repeat_values?vm.repeat_values.split(","):"";
            if ($scope.theForm.$valid) {

                vm.save();
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
            }
        }
    }

})();