/**
 * tree.service Created by zppro on 16-3-26.
 * Target:用途
 */
(function() {
    'use strict';

    angular
        .module('app.tree')
        .provider('treeFactory', treeFactory)
    ;

    function treeFactory() {

        function filter(nodes, fn) {
            if (!fn)
                return nodes;
            nodes = angular.isArray(nodes) ? nodes : [nodes];
            for (var i = 0; i < nodes.length; i++) {
                if (fn(nodes[i])) {

                    if (nodes[i].children && nodes[i].children.length > 0) {
                        filter(nodes[i].children, fn);
                    }
                }
                else {
                    nodes.splice(i, 1);
                    i--;
                }
            }
        }

        function pick(nodes, fn) {
            if (!fn)
                return true;
            nodes = angular.isArray(nodes) ? nodes : [nodes];
            var result = false;
            for (var i = 0; i < nodes.length; i++) {
                var levelResult = false;
                if (fn(nodes[i])) {
                    levelResult = true;
                }
                else {
                    //console.log(nodes[i].name);
                    if (nodes[i].children && nodes[i].children.length > 0) {
                        //检测子孙
                        levelResult = pick(nodes[i].children, fn);
                        if (!levelResult) {
                            //子孙没找到
                            nodes.splice(i, 1);
                            i--;
                        }
                    }
                    else {
                        //叶子节点则删除自身
                        nodes.splice(i, 1);
                        levelResult = false;
                        i--;
                    }
                }

                result = result || levelResult;
            }

            return result;
        }

        function attrs(nodes, level, levelSplitChar, parentOrderNo, parentIndex) {
            nodes = angular.isArray(nodes) ? nodes : [nodes];
            if (!level) {
                level = 1;
            }

            if (!levelSplitChar) {
                levelSplitChar = '-';
            }

            if (!parentOrderNo) {
                parentOrderNo = 1;
            }

            if (parentIndex) {
                parentIndex += levelSplitChar;
            }
            else {
                parentIndex = ''
            }


            var paddingLeftZero = '';
            var maxDigitLength = ('' + (nodes.length + 1)).length;
            var totalsOfCurrentLevel = nodes.length;
            for (var i = 0; i < nodes.length; i++) {
                paddingLeftZero = '';
                var currentIndex = parentIndex + i;
                var digit = ('' + (i + 1)).length;
                //console.log(digit);
                for (var j = digit; j < maxDigitLength; j++) {
                    paddingLeftZero += '0';
                }

                var currentOrderNo = parseInt(parentOrderNo * 10 + paddingLeftZero + (i + 1))
                nodes[i].attrs = {
                    level: level,
                    index: currentIndex,
                    orderNo: currentOrderNo
                };
                //console.log('attr.index:' + nodes[i].attrs.index);
                if (nodes[i].children && nodes[i].children.length > 0) {
                    totalsOfCurrentLevel += attrs(nodes[i].children, level + 1, levelSplitChar, currentOrderNo, currentIndex);
                }
            }

            return totalsOfCurrentLevel;
        }


        return {

            // controller access level
            $get: ['$injector', '$templateCache', '$q', '$timeout', '$rootScope','$document', function ($injector, $templateCache, $q, $timeout, $rootScope,$document) {

                return {
                    filter: filter,
                    pick: pick,
                    attrs: attrs,
                    sTree: sTree
                };

                function sTree(el, treeData, option) {
                    var self = this;
                    //私有方法和属性
                    this._expandedIndexes = {};
                    this._checkedIndexes = {};


                    this.el = angular.isString(el) ? angular.element('#' + el) : el;
                    this.treeData = treeData;
                    option = option || {};

                    this.readonly = option.readonly || false;
                    this.mode = option.mode || 'default'; //default,check,
                    this.selectNodeFormat = option.selectNodeFormat || '_id';// '_id,name' 或者 'object'
                    this.levelSplitChar = option.levelSplitChar || '-';
                    this.expandLevel = option.expandLevel || 1;
                    if (angular.isUndefined(option.checkCascade)) {
                        this.checkCascade = true;
                    }
                    else {
                        this.checkCascade = option.checkCascade;
                    }
                    this.layout = option.layout || 'default'; //default,dropdown
                    this.height = option.height || 500;

                    this.el_ulc = this.el.children('.ul-container')
                    if(this.layout == 'dropdown') {
                        this.el_ulc.addClass('tree-hidden').children('ul').height(this.height || 500);
                    }
                    else if(this.layout == 'nav'){
                    }
                    else if(this.layout == 'tile'){
                    }
                    else {
                        this.el_ulc.height(this.height || 500);
                    }

                    this.totalNodeCounts = attrs(this.treeData);//增加attrs

                    this._expand = function ($index) {
                        var arr = $index.split(this.levelSplitChar);
                        if (angular.isDefined(this._expandedIndexes[$index])) {
                            this._expandedIndexes[$index] = true;
                            //this.collapseAllBut($index);
                        }
                        if (arr.length > 1) {
                            var parentIndex = arr.slice(0, arr.length - 1).join(this.levelSplitChar);
                            this._expand(parentIndex);
                        }
                    }

                    this._UpdateCheckState = function ($index, toState,inputToCheck) {
                        //设置自身
                        this._checkedIndexes[$index] = toState;
                        this.inputCheckedIndex[$index] = inputToCheck;

                        //级联则需要影响子孙和祖先
                        var arr = $index.split(this.levelSplitChar);
                        if (this.checkCascade) {
                            //设置子孙为checked
                            for (var k in this._checkedIndexes) {

                                if (k.split(this.levelSplitChar).length >= (arr.length + 1) && (k).indexOf($index + this.levelSplitChar) == 0) {
                                    this._checkedIndexes[k] = toState;
                                    this.inputCheckedIndex[k] = inputToCheck;
                                }
                            }

                            //更新祖先
                            if (arr.length > 1) {

                                var parentIndex = arr.slice(0, arr.length - 1).join(this.levelSplitChar);
                                this._UpdateUndeterminedChecked(parentIndex);
                            }
                        }
                    }

                    this._UpdateUndeterminedChecked = function ($index) {
                        //console.log('_UpdateUndeterminedChecked:' + $index);
                        $index += '';
                        var arr = $index.split(this.levelSplitChar);

                        var checkedCount = 0, noneCount = 0, matchedCount = 0;
                        for (var k in this._checkedIndexes) {
                            //查找当前节点的直接字节点计算

                            if (k.split(this.levelSplitChar).length == (arr.length + 1) && (k).indexOf($index+this.levelSplitChar) == 0) {
                                //console.log('k.split(this.levelSplitChar).length:'+k.split(this.levelSplitChar).length);
                                //console.log('(arr.length + 1):'+(arr.length + 1));
                                //console.log('k:'+k);
                                //console.log('$index:'+$index);
                                //console.log('(k).indexOf($index):'+(k).indexOf($index));
                                matchedCount++;
                                if (this._checkedIndexes[k] == this.checkState.undetermined) {
                                    matchedCount = noneCount = checkedCount = 0;
                                    //直接存在undetermined状态
                                    this._checkedIndexes[$index] = this.checkState.undetermined;
                                    this.inputCheckedIndex[$index] = true;
                                    break;
                                }
                                else if (this._checkedIndexes[k] == this.checkState.none) {
                                    noneCount++;
                                }
                                else {
                                    checkedCount++;
                                }
                            }
                        }

                        if (matchedCount > 0) {
                            if (checkedCount > 0 && noneCount > 0) {
                                //有checked 又有none,则更新为undetermined状态
                                this._checkedIndexes[$index] = this.checkState.undetermined;
                                this.inputCheckedIndex[$index] = true;

                            }
                            else {
                                this._checkedIndexes[$index] = checkedCount == matchedCount ? this.checkState.checked : this.checkState.none;
                                this.inputCheckedIndex[$index] = checkedCount == matchedCount;
                            }
                        }
                        //console.log('this._checkedIndexes['+$index+']:'+this._checkedIndexes[$index]);
                        //console.log('matchedCount:'+matchedCount+' checkedCount:'+checkedCount+' noneCount:'+noneCount);
                        //console.log(this._checkedIndexes);
                        //递归
                        if (arr.length == 1) {
                            return;
                        }
                        else {
                            var parentIndex = arr.slice(0, arr.length - 1).join(this.levelSplitChar);
                            this._UpdateUndeterminedChecked(parentIndex);
                        }
                    }
                    this._getCheckedNodes = function (nodes, parentIndex) {
                        if (!nodes)
                            nodes = angular.isArray(this.treeData) ? this.treeData : [this.treeData];

                        var arrChecked = [];
                        var checkIndexPrefix = (parentIndex ? parentIndex + this.levelSplitChar : parentIndex) || '';

                        for (var i = 0; i < nodes.length; i++) {
                            var checkIndex = checkIndexPrefix + i;

                            var hasChildren = nodes[i].children && nodes[i].children.length > 0;

                            if (this._checkedIndexes[checkIndex] != 'none') {

                                if (this._checkedIndexes[checkIndex] == 'checked') {
                                    if (this.checkCascade) {
                                        //级联的check只允许获得叶子节点
                                        if (!hasChildren) {
                                            arrChecked.push(nodes[i]);
                                        }
                                    }
                                    else {
                                        arrChecked.push(nodes[i]);
                                    }
                                }
                            }

                            if (hasChildren) {
                                arrChecked = arrChecked.concat(this._getCheckedNodes(nodes[i].children, checkIndex))
                            }
                        }

                        return arrChecked
                    }
                    this._findNode = function (nodes, $index) {
                        if (!nodes)
                            return null;
                        var arr = $index.split(this.levelSplitChar);
                        var currentLevelIndex = arr[0];
                        for (var i = 0; i < nodes.length; i++) {
                            if (currentLevelIndex == i) {
                                if (arr.length == 1) {

                                    return nodes[i];
                                }
                                else {
                                    if (nodes[i].children && nodes[i].children.length > 0) {
                                        return this._findNode(nodes[i].children, arr.slice(1).join(this.levelSplitChar));
                                    }
                                    else {
                                        return null;
                                    }
                                }
                            }
                        }
                        return null;
                    }
                    this._findNodeById = function (_id, nodes, $parentIndex) {
                        //$parentIndex = $parentIndex || '';
                        for (var i = 0; i < nodes.length; i++) {
                            if (_id === nodes[i]._id) {
                                return nodes[i];
                            }

                            if (nodes[i].children && nodes[i].children.length > 0) {
                                var currentIndex = $parentIndex ? $parentIndex + this.levelSplitChar + i : i + '';
                                var resultInChildren = this._findNodeById(_id, nodes[i].children, currentIndex);
                                if (resultInChildren) {
                                    return resultInChildren;
                                }
                            }
                        }
                        return null;
                    }
                    this._findNodeIndexById = function (_id, nodes, $parentIndex) {

                        for (var i = 0; i < nodes.length; i++) {
                            var currentIndex = $parentIndex ? $parentIndex + this.levelSplitChar + i : i + '';

                            if (_id === nodes[i]._id) {
                                return currentIndex;
                            }

                            if (nodes[i].children && nodes[i].children.length > 0) {
                                var resultInChildren = this._findNodeIndexById(_id, nodes[i].children, currentIndex);
                                if (resultInChildren) {
                                    return resultInChildren;
                                }
                            }
                        }
                        return null;
                    }

                    //可暴露的方法和属性
                    this.checkState = {none: 'none', checked: 'checked', undetermined: 'undetermined'};
                    this.selectedNode;
                    this.checkedNodes = [];
                    this.inputCheckedIndex = {};
                    this.eventNames = ['select', 'checkChange'];
                    this.eventHanders = {}

                    this._addEventListener = function (eventName, eventHanler) {
                        if(this.eventNames.indexOf(eventName) != -1){
                            if (!this.eventHanders[eventName]) {
                                this.eventHanders[eventName] = [];
                            }
                            this.eventHanders[eventName].push(eventHanler);
                        }
                    }

                    this._removeEventListener = function (eventName, eventHanler) {
                        if (this.eventHanders[eventName]) {
                            var handlers = this.eventHanders[eventName];
                            if (eventHanler) {
                                var index = handlers.indexOf(eventHanler);
                                if (index != -1) {
                                    handlers.splice(index, 1);
                                }
                            } else {
                                handlers.length = 0;
                            }
                        }
                    }

                    this.getSelectedNode = function(){
                        return this.selectedNode;
                    }

                    this.addIndex = function ($index) {
                        var arr = ($index + '').split(this.levelSplitChar);
                        var level = arr.length;
                        var levelExpanded = level <= this.expandLevel;
                        if(this.layout == 'nav') {
                            if ($index == 0) {
                                levelExpanded = true;
                            }
                            else {
                                levelExpanded = false;
                            }
                        }
                        else if(this.layout == 'tile') {
                            //tile不受expandLevel参数影响
                            levelExpanded = true;
                        }
                        this._expandedIndexes[$index] = levelExpanded;
                        if (this.mode == 'check') {
                            this._checkedIndexes[$index] = this.checkState.none;
                            this.inputCheckedIndex[$index] = false;
                            //console.log(this._checkedIndexes);
                        }
                    }

                    this.compare = option.compare || function (node1, node2) {
                            return node1 === node2 || node1._id === node2._id;
                        };

                    this.isExpanded = function ($index) {
                        //console.log('isExpandedByIndex:'+$index);
                        return this._expandedIndexes[$index];
                    }

                    this.isChecked = function ($index) {
                        return this._checkedIndexes[$index] == this.checkState.checked;
                    }

                    this.isUndetermined = function ($index) {
                        return this._checkedIndexes[$index] == this.checkState.undetermined;
                    }

                    this.isNone = function ($index) {
                        return this._checkedIndexes[$index] == this.checkState.none;
                    }

                    this.toggle = function ($index, $event) {
                        if (angular.isDefined(this._expandedIndexes[$index])) {
                            this._expandedIndexes[$index] = !this._expandedIndexes[$index];
                            if (this.mode != 'check') {
                                if (this.layout != 'nav' && this.layout != 'tile') {
                                    this.collapseAllBut($index);
                                }
                                else {
                                    var arr = ($index + '').split(this.levelSplitChar);
                                    var level = arr.length;
                                    if (level == 1) {
                                        this.collapseLevelBut($index);
                                    }
                                }
                            }
                        }

                        $event.stopPropagation();
                        return false;
                    }

                    this.expand = function ($index) {
                        this._expand($index);
                    }

                    this.collapseAllBut = function ($index) {
                        $index += '';
                        for (var i in this._expandedIndexes) {
                            if ($index < 0 || $index.indexOf(i) < 0)
                                this._expandedIndexes[i] = false;
                        }
                    }

                    this.collapseLevelBut = function ($index) {
                        $index += '';
                        var level = $index.split(this.levelSplitChar).length;
                        for (var i in this._expandedIndexes) {
                            var itemLevel = (i + '').split(this.levelSplitChar).length;
                            if (level < 0 || (level == itemLevel && $index.indexOf(i) < 0))
                                this._expandedIndexes[i] = false;
                        }
                    }

                    this.select = function (node, $event) {
                        if(this.readonly && $event.currentTarget)
                            return;

                        if (this.compare(node, this.selectedNode || {})) {
                            $event && $event.currentTarget && $event.stopPropagation();
                            return;
                        }
                        //this.mode == 'check' ||

                        //console.log(angular.element('#' + id + ' .tree-node-selected').size()); 
                        this.el.find('.tree-node-selected').removeClass('tree-node-selected');
                        this.el.find('.tree-node-cascade-selected').removeClass('tree-node-cascade-selected');
                        //angular.element('#' + id + ' .tree-node-selected').removeClass('tree-node-selected');
                        this.selectedNode = node;

                        var target = $event && $event.currentTarget;
                        if(!target)
                            target = $event;//第二个参数在编程调用时是可以是指定的jquery对象

                        angular.element(target).addClass('tree-node-selected');

                        if(angular.element(target).hasClass('parent-cascade-select')){
                            console.log('cascade-select:');
                            //console.log(angular.element(target).parents('.tree-node'));
                            //this.el.find('.cascade-selectable').addClass('tree-node-cascade-selected')
                            //console.log(angular.element(target).parents().filter('.tree-group').children('.cascade-selectable'));
                            angular.element(target).parents().filter('.tree-group').children('.cascade-selectable').addClass('tree-node-cascade-selected')
                        }
                        var handlers = this.eventHanders['select'];
                        if(handlers) {
                            for (var i=0,len=handlers.length;i<len;i++) {
                                handlers[i]({selectedNode:this.selectedNode});
                            }
                        }
                        $rootScope.$broadcast('tree:node:select', this.selectedNode, this);



                        if($event && $event.currentTarget)
                            $event && $event.stopPropagation();
                    }

                    this.toggleCheck = function ($index, $event) {
                        if(this.readonly && !$event.source)
                            return;
                        $index += '';
                        if (angular.isDefined(this._checkedIndexes[$index])) {
                            var toState, inputToCheck;

                            //var $elem = angular.element($event.currentTarget);
                            //console.log($elem);
                            if (this._checkedIndexes[$index] == this.checkState.checked) {
                                toState = this.checkState.none;
                                inputToCheck = false;
                            }
                            else {
                                toState = this.checkState.checked;
                                inputToCheck = true;
                            }

                            this._UpdateCheckState($index, toState, inputToCheck);


                            //手工动作重新设置checked节点
                            if ($event && $event.currentTarget) {
                                this.checkedNodes = this._getCheckedNodes();
                                var handlers = this.eventHanders['checkChange'];
                                if(handlers) {
                                    for (var i=0,len=handlers.length;i<len;i++) {
                                        handlers[i]({checkedNodes:this.checkedNodes});
                                    }
                                }
                                $rootScope.$broadcast('tree:node:checkChange', this.checkedNodes, this);
                            }
                        }
                        if ($event && $event.currentTarget)
                            $event && $event.stopPropagation();
                        //console.log(this._checkedIndexes);
                        //console.log(this.inputCheckedIndex);
                        //return false;
                    }

                    this.check = function ($index,$event) {
                        if(this.readonly && !$event.source)
                            return;
                        $index += '';
                        if (angular.isDefined(this._checkedIndexes[$index])) {

                            this._UpdateCheckState($index, this.checkState.checked, true);

                            //手工动作重新设置checked节点
                            if ($event && $event.currentTarget) {
                                this.checkedNodes = this._getCheckedNodes();
                                var handlers = this.eventHanders['checkChange'];
                                if(handlers) {
                                    for (var i=0,len=handlers.length;i<len;i++) {
                                        handlers[i]({checkedNodes:this.checkedNodes});
                                    }
                                }
                                $rootScope.$broadcast('tree:node:checkChange', this.checkedNodes, this);
                            }
                        }
                        if ($event && $event.currentTarget)
                            $event && $event.stopPropagation();
                    }

                    this.unCheck = function ($index,$event) {
                        if(this.readonly && !$event.source)
                            return;
                        $index += '';
                        if (angular.isDefined(this._checkedIndexes[$index])) {

                            this._UpdateCheckState($index, this.checkState.none, false);

                            //手工动作重新设置checked节点
                            if ($event && $event.currentTarget) {
                                this.checkedNodes = this._getCheckedNodes();
                                var handlers = this.eventHanders['checkChange'];
                                if(handlers) {
                                    for (var i=0,len=handlers.length;i<len;i++) {
                                        handlers[i]({checkedNodes:this.checkedNodes});
                                    }
                                }
                                $rootScope.$broadcast('tree:node:checkChange', this.checkedNodes, this);
                            }
                        }
                        if ($event && $event.currentTarget)
                            $event && $event.stopPropagation();
                    }



                    this.getCheckedNodes = function () {
                        this.checkedNodes = this._getCheckedNodes();
                    }

                    this.findNode = function ($index) {
                        return this._findNode(this.treeData, $index);
                    }

                    this.findNodeById = function (_id) {
                        return this._findNodeById(_id, this.treeData);
                    }

                    this.findNodeIndexById = function (_id) {
                        return this._findNodeIndexById(_id, this.treeData);
                    }

                    //dropdown
                    this.toggleDropdown = function () {
                        if(this.readonly && !$event.source )
                            return;
                        this.dropdownOpened ? this.closeDropdown() : this.openDropdown();
                    }

                    this.openDropdown = function () {
                        if(this.readonly && !$event.source)
                            return;

                        if (this.dropdownOpened)
                            return;
                        //if (self.height != self.joulc.height()) {
                        //    this.joulc.height(this.height);
                        //}
                        var clientHeight = $document[0].body.clientHeight;
                        var clientWidth = $document[0].body.clientWidth;
                        var parentTop = this.el.offset().top;
                        var parentleft = this.el.offset().left;
                        var offsetTop = this.el.height();
                        var offsetLeft = 0;
                        var deltaHeight = 16;
                        if (parentTop + offsetTop +  this.height > clientHeight) {
                            offsetTop = -this.height - deltaHeight;
                        }

                        if (parentleft + offsetLeft + this.el_ulc.width() > clientWidth) {
                            offsetLeft = -(clientWidth - this.el_ulc.width());
                        }
                        this.el_ulc.css({top: offsetTop, left: offsetLeft}).removeClass('tree-hidden');

                        this.dropdownOpened = true;
                    }

                    this.closeDropdown = function ($event) {
                        if(this.readonly && !$event.source)
                            return;
                        if (!this.dropdownOpened)
                            return;
                        this.el_ulc.addClass('tree-hidden');
                        this.dropdownOpened = false;
                    }
                }
            }]
        };
    }

})();