/**
 * utils.directive Created by zppro on 16-3-24.
 */

(function() {
    'use strict';

    angular
        .module('app.tree')
        .directive('sTree', sTree)
        .directive('sTreeNode', sTreeNode)
        .directive('supportPreSelectOrCheck', supportPreSelectOrCheck)
    ;

    sTree.$inject = ['$parse','$templateCache','$document','$timeout','$q','treeFactory'];
    function sTree($parse,$templateCache,$document,$timeout,$q,treeFactory) {
        var directive = {
            restrict: 'A',
            compile: compile,
            require: ['sTree', '?ngModel'],
            controller: ['$scope', function ($scope, element) {
                var self = this;
                var methodNames = ['addIndex', 'compare', 'isExpanded', 'isChecked', 'isUndetermined', 'isNone', 'toggle', 'expand',
                    'collapseAllBut', 'select', 'getCheckedNodes', 'findNode', 'findNodeById',
                    'findNodeIndexById', 'toggleDropdown', 'openDropdown', 'closeDropdown', 'getSelectedNode'];
                var properyNames = ['treeData', 'mode', 'layout', 'readonly', 'selectNodeFormat', 'checkCascade', 'levelSplitChar', 'inputCheckedIndex'];

                this._bindTree = function () {
                    //绑定方法
                    var ctx = $scope._tree;
                    angular.forEach(methodNames, function (methodName) {
                        self[methodName] = angular.bind(ctx, ctx[methodName]);
                    });
                    //绑定属性
                    angular.forEach(properyNames, function (properyName) {
                        self[properyName] = ctx[properyName];
                    });

                    this.linked = 0;
                    this.totals = ctx.totalNodeCounts;
                };

                this.isDisabled = function (node) {
                    var ret = false;
                    if ($scope.isDisabled) {
                        ret = $scope.isDisabled({node: node});
                    }
                    return ret;
                };

                this.treeNodeFunc = function (node) {
                    var ret;
                    if ($scope.treeNodeFunc) {
                        ret = $scope.treeNodeFunc({node: node});
                    }
                    return ret;
                };

                this._markNodeLinked = function (promise) {
                    var self = this;
                    promise.then(function () {
                        self.linked++;
                        if (self.linked == self.totals) {
                            if (self.layout == 'dropdown' && self.mode == 'check') {
                                $scope._onDropdownCheck();
                            }

                            if (self.layout == 'nav' || self.layout == 'tile') {
                                console.log('_setContentHeight');
                                $scope._setContentHeight();
                            }

                            if (self.mode == 'check') {
                                //保证ngModel一致性
                                self._syncModelForCheck();
                            }
                            console.log('tree load finished');
                            self.treeLoadFinished = true;
                        }
                        else {
                            self.treeLoadFinished = false;
                        }
                    });
                };

                //需要在次更新model
                this.toggleCheck = function (node, $event) {
                    $scope._tree.toggleCheck(node.attrs.index, $event);
                    this._syncModelForCheck();
                    if (this.layout == 'dropdown' && this.mode == 'check') {
                        $scope._onDropdownCheck();
                    }
                };
                this._check = function (node, $event) {
                    $scope._tree.check(node.attrs.index, $event);
                };

                this.setModelForSelect = function (node) {
                    //model-view
                    if (this.selectNodeFormat != '_id') {
                        this._setModelForSelect(node);
                    }
                };

                this._setModelForSelect = function (node) {
                    if (this.selectNodeFormat == '_id') {
                        $scope.ngModel = node._id;
                    }
                    else if (this.selectNodeFormat == 'object') {
                        $scope.ngModel = node;
                    }
                    else {
                        var arr = this.selectNodeFormat.split(',');
                        var model = {};
                        for (var i = 0; i < arr.length; i++) {
                            var key = arr[i];
                            if (node[key]) {
                                model[key] = node[key];
                            }
                        }
                        $scope.ngModel = model;
                    }
                    $scope.$apply();
                };

                this._syncModelForCheck = function () {
                    var checkedNodes = [];
                    var self = this;
                    angular.forEach($scope._tree.checkedNodes, function (node) {
                        if (self.selectNodeFormat == 'object') {
                            checkedNodes.push(node);
                        }
                        else {
                            checkedNodes.push(node._id);
                        }
                    });

                    $scope.ngModel = checkedNodes;
                };

                this._getModel = function () {
                    return $scope.ngModel;
                };

            }],
            controllerAs: '$tree',
            templateUrl: function (elem, attrs) {
                return attrs.sTreeTemplateUrl || 'tree-directive-default-renderer.html'
            },
            scope: {treeData: '=sTreeData', treeHeight: '=sTreeHeight', ngModel: '=', isDisabled:'&sTreeNodeIsDisabled', treeNodeFunc: '&sTreeNodeFunc'}
        };
        return directive;

        function compile(element, attrs) {

            var option = $parse((attrs.sTreeOption||'').replace('{{','"%7B%7B').replace('}}','%7D%7D"'))();
            if(option && option.layout == 'dropdown') {
                //增加input-group等
                angular.element($templateCache.get('tree/dropdown.tpl.html')).prependTo(element);
            }
            return {
                post: link
            };
        }

        function link(scope, element, attrs,ctls) {
            var $tree = ctls[0];
            var ngModel = ctls[1];

            scope.$watch("treeData",function(newValue,oldValue) {
                if (newValue != oldValue) {
                    if(attrs.ngIf){
                        var exp = attrs.ngIf.replace('!', '');

                        var setter = $parse(exp).assign;
                        setter(scope.$parent, true);
                        $timeout(function () {
                            setter(scope.$parent, false);
                        }, 0);
                        console.log('recreate end')
                    }
                }
            });

            var option = scope.$eval(attrs.sTreeOption) || {};
            var height = Number(scope.treeHeight);
            option.height = height;
            var dropdownValue =  option.dropdownValue || 'name';

            // Bring in changes from outside:
            scope.$watch('ngModel', function(newValue,oldValue) {

                if(!$tree.treeLoadFinished)
                    return;

                if($tree.mode == 'check'){
                    //for promise ngModel
                    if (newValue != oldValue && oldValue!=undefined) {
                        if(!angular.isArray(newValue))
                            return;

                        scope._tree.checkedNodes = [];
                        for(var i=0;i<newValue.length;i++) {
                            if(angular.isString(newValue[i])){
                                scope._tree.checkedNodes.push($tree.findNodeById(newValue[i]));
                            }
                            else{
                                scope._tree.checkedNodes.push(newValue[i]);
                            }
                        }
                        angular.forEach(scope._tree.checkedNodes,function(node){

                            $tree._check(node, {currentTarget: true, stopPropagation: angular.noop,source:'directive'});
                            $tree.expand(node.attrs.index);
                        });

                        if ($tree.layout == 'dropdown' && $tree.mode == 'check') {
                            scope._onDropdownCheck();
                        }
                    }

                }
                else{
                    //for promise ngModel
                    if (newValue != oldValue){
                        var node = $tree.findNodeById(newValue);
                        if(node) {
                            $tree.select(node, angular.element(element).find('.' + node.attrs.index));
                            $tree.expand(node.attrs.index);
                            if ($tree.layout == 'dropdown') {
                                scope._onDropdownSelect(node);
                            }
                        }
                    }
                }

            });



            function createTree(data){
                $q.when(data).then(function (treeNodes) {
                    scope._tree = new treeFactory.sTree(element, treeNodes, option);

                }).then(function(){
                    $tree._bindTree();

                    if(option.layout == 'dropdown') {

                        var dropdownInput = element.children('.input-group').children('input');
                        var dropdownButton = element.children('.input-group').find('button');

                        if($tree.readonly){
                            dropdownInput.addClass('tree-input-readable').prop('readonly',true);
                            dropdownButton.prop('disabled',true);
                        }
                        else{
                            dropdownInput.on('focus', function () {
                                $tree.openDropdown();
                            });

                            dropdownButton.on('click', function ($event) {
                                $tree.openDropdown();
                                $event.stopPropagation();
                            });

                        }


                        scope._onDropdownSelect = function (node) {
                            dropdownInput.val(node[dropdownValue]);
                        };

                        scope._onDropdownCheck = function () {
                            var dropDownValues = [];
                            console.log('_onDropdownCheck...');
                            console.log(scope._tree.checkedNodes);
                            angular.forEach(scope._tree.checkedNodes,function(checkNode){
                                dropDownValues.push(checkNode[dropdownValue]);
                            });
                            dropdownInput.val(dropDownValues.join());


                        };
                        if(!$tree.readonly){
                            $document.on('click', function (event) {
                                var isClickedElementChildOfPopup = element.find(event.target).size() > 0;
                                //console.log('isClickedElementChildOfPopup:' + isClickedElementChildOfPopup);
                                if (element.find(event.target).size() == 0) {
                                    $tree.closeDropdown();
                                }
                            });
                        }

                    }
                    else if(option.layout == 'nav' || option.layout == 'tile') {
                        scope._setContentHeight = function () {
                            element.find('.tree-group-content').height(height);
                        };
                    }
                });
            }

            if (scope.treeData) {
                createTree(scope.treeData);
            }

        }
    }

    sTreeNode.$inject = ['$rootScope','$timeout','$q'];
    function sTreeNode($rootScope,$timeout,$q) {
        var directive = {
            link: link,
            restrict: 'A',
            require: '^sTree'
        };
        return directive;

        function link(scope, element, attrs,sTreeCtl) {

            //关联本节点和$tree
            var node = scope.node;
            var nIndex = node.attrs.index;
            var nLevel = node.attrs.level;
            sTreeCtl.addIndex(nIndex);

            //if(sTreeCtl
            var ele_to_select = element.find('span:first');//改 children
            if(sTreeCtl.layout == 'tile'){
                ele_to_select = element;
            }

            //行为 view-> model
            var nodeSingleClick = function($event) {


                if (sTreeCtl.mode != 'check') {
                    sTreeCtl._setModelForSelect(node);
                }
                sTreeCtl.select(node, ele_to_select);

                if (sTreeCtl.layout == 'dropdown') {
                    if (sTreeCtl.mode != 'check') {
                        scope._onDropdownSelect(node);
                        sTreeCtl.closeDropdown();
                    }
                }
            };

            var wrapNodeSingleClick = function($event) {
                clicks++;  //count clicks
                if (clicks === 1) {
                    timer = $timeout(function () {
                        nodeSingleClick($event);
                        clicks = 0;             //after action performed, reset counter
                    }, delay);
                } else {
                    $timeout.clear(timer);    //prevent single-click action
                    clicks = 0;             //after action performed, reset counter

                }
            };

            var nodeDblClick = function($event){
                $timeout(function(){
                    sTreeCtl.toggle(nIndex,$event);
                });

            };

            var delay = 70, clicks = 0, timer = null;
            element.addClass(nIndex);

            if(sTreeCtl.layout == 'nav') {
                element
                    .on('click',nodeDblClick)
                ;
            }
            else if(sTreeCtl.layout == 'tile') {
                //if(element.hasClass('tree-group-head')){
                //    element
                //        .on('click',nodeDblClick)
                //    ;
                //}
            }
            else{
                element
                    .on('dblclick',nodeDblClick)
                ;
            }

            node.props = node.props||{};

            node.props.disabled = sTreeCtl.isDisabled(node);

            if(!element.hasClass('no-select') && !sTreeCtl.readonly && !node.props.disabled) {
                ele_to_select.on('click', nodeSingleClick);
            }

            //var nodeExpandToggle = function($event){
            //    console.log('toggle')
            //    $timeout(function(){
            //        sTreeCtl.toggle(nIndex,$event);
            //    })
            //}
            //
            //
            //if(node.children && node.children.length > 0) {
            //    console.log(node);
            //    console.log(element.children('i').size());
            //    element.children('i').on('click', nodeExpandToggle);
            //}


            var promiseOfModelToView = true;
            var ngModel = sTreeCtl._getModel();//从model -> view
            if (sTreeCtl.mode != 'check') {
                //model -> view
                var selectedNode = ngModel;

                if (angular.isString(selectedNode)) {
                    selectedNode = {_id: selectedNode};
                }
                if (selectedNode && sTreeCtl.compare(selectedNode, node)) {
                    //保证选中

                    sTreeCtl.select(node, ele_to_select);
                    //保证展开
                    sTreeCtl.expand(nIndex);

                    if (sTreeCtl.layout == 'dropdown') {
                        scope._onDropdownSelect(node);
                    }

                    //保证ngModel一致性
                    sTreeCtl.setModelForSelect(node);
                }
            }
            else {
                //model -> view

                var checkedNodes = ngModel;
                if(checkedNodes && checkedNodes.length>0){

                    for (var i = 0; i < checkedNodes.length; i++) {
                        var checkNode;
                        if(angular.isString(checkedNodes[i])) {
                            checkNode = sTreeCtl.findNodeById(checkedNodes[i]);
                            //console.log(checkNode);
                        }
                        else{

                            checkNode = checkedNodes[i];
                        }

                        if (sTreeCtl.checkCascade && checkNode.children && checkNode.children.length > 0) {
                            //在级联情况下只选择叶子节点下，将这些带有子节点的node去掉

                            checkedNodes.splice(i, 1);
                        }
                        else {
                            if (sTreeCtl.compare(checkNode, node)) {
                                //设置check //模拟$event，使checkNodes重新计算

                                sTreeCtl._check(node, {currentTarget: true, stopPropagation: angular.noop,source:'directive'});
                                //保证展开
                                sTreeCtl.expand(nIndex);

                                ////更新input显示
                                //if (sTreeCtl.layout == 'dropdown') {
                                //    console.log('exec _onDropdownCheck');
                                //}
                            }
                        }
                    }
                }
            }

            sTreeCtl._markNodeLinked($q.when(promiseOfModelToView));
        }
    }

    supportPreSelectOrCheck.$inject = ['$rootScope'];
    function supportPreSelectOrCheck($rootScope) {
        var directive = {
            link: link,
            restrict: 'A'
        };
        return directive;

        function link(scope, element, attrs) {
            var tree = scope.vm.trees[attrs.treeIndex];
            var currentNodeId = attrs.nodeId;
            var currentNodeIndex = attrs.nodeIndex;
            if (tree.mode != 'check') {

                if (tree.selectedNode && tree.selectedNode._id == currentNodeId) {
                    //选中样式
                    element.addClass('tree-node-selected');

                    //保证展开
                    tree.expand(currentNodeIndex);

                    //触发事件
                    $rootScope.$broadcast('tree:node:select',tree.selectedNode, tree);

                }
            }
            else {
                //console.log(tree.checkedNodes);
                for (var i = 0; i < tree.checkedNodes.length; i++) {

                    if (tree.checkCascade && tree.checkedNodes[i].children && tree.checkedNodes[i].children.length > 0) {
                        //在级联情况下只选择叶子节点下，将这些带有字节点的node去掉
                        tree.checkedNodes.splice(i,1);
                    }
                    else {
                        if (currentNodeId === tree.checkedNodes[i]._id) {
                            //设置check
                            tree.toggleCheck(currentNodeIndex, null);

                            //保证展开
                            tree.expand(currentNodeIndex);
                        }
                    }
                }
            }

        }
    }


})();
