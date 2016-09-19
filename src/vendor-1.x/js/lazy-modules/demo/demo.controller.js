/**=========================================================
 * Module: demo.controller.js
 * Handle demo elements
 =========================================================*/

(function() {
    'use strict';

    angular
        .module('app.demo')
        .controller('DemoGridBasicController', DemoGridBasicController)
        .controller('DemoGridBasicDetailsController', DemoGridBasicDetailsController)
        .controller('DemoTreeBasicController', DemoTreeBasicController)
        .controller('DemoTreeExtendController', DemoTreeExtendController)
        .controller('DemoTreeDirectiveController', DemoTreeDirectiveController)
        .controller('DemoTreeNavController', DemoTreeNavController)
        .controller('DemoTreeTileController', DemoTreeTileController)
        .controller('DemoIMGProcessQiNiuController',DemoIMGProcessQiNiuController)
        .controller('DemoDropdownController', DemoDropdownController)
        .controller('DemoBoxInputController', DemoBoxInputController)
        .controller('DemoPromiseController',DemoPromiseController)
    ;

    DemoGridBasicController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function DemoGridBasicController($scope, ngDialog, vmh, vm) {

        $scope.vm = vm;
        $scope.utils = vmh.utils.g;

        init();


        function init() {

            //console.log(vm._subsystem_);
            //console.log(vm._module_);
            //console.log(vm._view_);
            //console.log(vm._action_);
            vm.init({removeDialog: ngDialog});
            vm.query();

        }

    }

    DemoGridBasicDetailsController.$inject = ['$scope', 'vmh', 'entityVM'];

    function DemoGridBasicDetailsController($scope, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;
        //$scope.utils.vinput.$inject = ['$scope'];

        init();

        function init() {
            //console.log(entity._subsystem_);
            //console.log(entity._module_);
            //console.log(entity._view_);
            //console.log(entity._action_);
            //console.log(entity._id_);
            vm.doSubmit = doSubmit;

            vm.tab1 = {cid: 'contentTab1'};
            vm.tab2 = {cid: 'contentTab2'};

            if (vm._id_ != 'new') {


                var defered = vmh.q.defer();
                var promise = defered.promise;

                vmh.timeout(function () {

                    defered.resolve({success: true, error: null});
                    //defered.reject({success: false, error: 'test error'});
                }, 1000);

                promise.then(function (ret) {
                    vm.load();
                }).catch(function (err) {
                    console.log('load error:');
                    console.log(err);
                }).finally(function () {
                    vmh.loadingBar.complete(); // End loading.
                    vmh.blocker.stop();
                });

                console.log('load...');
                vmh.loadingBar.start();
                vmh.blocker.start();
            }

        }


        function doSubmit() {

            if ($scope.demoForm.$valid) {
                //console.log(vm.model);
                //var defered = vmh.q.defer();
                //var promise = defered.promise;
                //
                //vmh.timeout(function () {
                //
                //    vm.save();
                //    defered.resolve({success: true, error: null});
                //    //defered.reject({success: false, error: 'test error'});
                //}, 2000);
                //
                //promise.then(function (ret) {
                //    $scope.$state.go(vm.moduleRoute('list'));
                //}).catch(function (err) {
                //}).finally(function () {
                //    vmh.loadingBar.complete(); // End loading.
                //    vmh.blocker.stop();
                //});
                //
                //vmh.loadingBar.start();
                //vmh.blocker.start();
                vm.save();
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
                else if ($scope.utils.vtab(vm.tab2.cid)) {
                    vm.tab2.active = true;
                }
            }
        }
    }

    DemoTreeBasicController.$inject = ['$scope','vmh', 'instanceVM'];

    function DemoTreeBasicController($scope,vmh, vm) {

        $scope.vm = vm;

        init();


        function init() {
            vm.init();

            var subsystemURL = 'server/district.json' + '?v=' + (new Date().getTime()); // jumps cache
/**
 * utils.directive Created by zppro on 16-3-24.
 */

(function() {
    'use strict';
    var jqLite      = angular.element;

    angular
        .module('app.utils')
        .directive('onFinishRender', onFinishRender)
        .directive('requireMultiple',requireMultiple)
        .directive('idNo2',idNo2)
        .directive('extractSex',extractSex)
        .directive('extractBirthday',extractBirthday)
        .directive('boxInput',boxInput)
        .directive('datetimePicker',datetimePicker)
    ;

    onFinishRender.$inject = ['$timeout'];
    function onFinishRender ($timeout) {
        var directive = {
            link: link,
            restrict: 'A'
        };
        return directive;

        function link(scope, element, attrs) {
            if (scope.$last === true) {
                var option = angular.fromJson(attrs.onFinishRender);
                if (option && option.type)
                    $timeout(function () {

                        scope.$emit(option.type + 'Finished:' + option.sub || '');
                    });
            }
        }
    }

    function requireMultiple() {
        var directive = {
            link: link,
            restrict: 'A',
            require: 'ngModel'
        };
        return directive;

        function link(scope, element, attrs, ngModel) {
            //ngModel.$validators有任何验证同步过，器对应的ngModel值就为undefined，因此会影响任何$watch这个ngModel的值
            ngModel.$validators.required = function (value) {
                return angular.isArray(value) && value.length > 0;
            };
        }
    }

    idNo2.$inject = ['IDNo2Utils'];
    function idNo2(IDNo2Utils){
        var directive = {
            link: link,
            restrict: 'A',
            require: 'ngModel'
        };
        return directive;

        function link(scope, element, attrs, ngModel) {
            ngModel.$validators.IDNo = function (value) {
                if(!value){
                    return true;
                }
                var ret = false;

                ret = IDNo2Utils.isIDNo(value);

                var option = scope.$eval(attrs.idNo2) || {};
                if(option.successEvent && ret) {
                    scope.$emit('idNo2:parseSuccess', value);
                }

                return ret;
            };
        }
    }

    extractSex.$inject = ['IDNo2Utils'];
    function extractSex(IDNo2Utils) {
        var directive = {
            link: link,
            restrict: 'A'
        };
        return directive;

        function link(scope, element, attrs) {
            scope.$watch(attrs.extractSex, function (newValue, oldValue) {
                var radioValue = scope.$eval(attrs.btnRadio);
                if (newValue) {
                    if (radioValue == IDNo2Utils.extractSex(newValue)) {
                        scope.$eval(attrs.ngModel + '="' + radioValue + '"');
                    }
                }
                else {
                    if (radioValue == 'N') {
                        scope.$eval(attrs.ngModel + '="' + radioValue + '"');
                    }
                }
            });
        }
    }

    extractBirthday.$inject = ['IDNo2Utils'];
    function extractBirthday(IDNo2Utils) {
        var directive = {
            link: link,
            restrict: 'A'
        };
        return directive;

        function link(scope, element, attrs) {
            scope.$watch(attrs.extractBirthday, function (newValue, oldValue) {
                if (newValue) {
                    var dateStr = IDNo2Utils.extractBirthday(newValue);
                    scope.$eval(attrs.ngModel + '="' + dateStr + '"');
                }
                else {
                    scope.$eval(attrs.ngModel + '=""');
                }
            });
        }
    }


    boxInput.$inject = ['$timeout'];
    function boxInput($timeout){

        function setCaretPosition(elem, caretPos) {
            if (elem !== null) {
                if (elem.createTextRange) {
                    var range = elem.createTextRange();
                    range.move('character', caretPos);
                    range.select();
                } else {
                    if (elem.setSelectionRange) {
                        elem.focus();
                        elem.setSelectionRange(caretPos, caretPos);
                    } else{
                        elem.focus();
                    }

                }
            }
        }

        function showValue(val,$spanArray,inputType,tip) {
            //console.log(tip);
            var valLength = Number(val.length);
            for (var i = 0; i < valLength; i++) {
                var $span = $spanArray.eq(i);
                if (inputType == 'password') {
                    $span.html('·');
                }
                else {
                    $span.html(val[i]);
                }
            }
        }

        function unbindEvents(element) {
            element.parent('.virbox').off('click');
            element
                .off('blur')
                .off('keyup')
                .off('keydown');
        }

        function bindEvents(scope,element,inputType) {
            element.parent('.virbox')
                .on('click', function () {
                    var $input = jqLite(this).find('.realbox');

                    $input.focus();

                    jqLite(this).find('span').addClass('focus');
                    setCaretPosition($input[0], Number($input.val().length));
                });

            element
                .on('blur', function () {
                    jqLite(this).parent('.virbox').find('span').removeClass('focus');
                })
                .on('keyup', function (event) {
                    var $spanArray = jqLite(this).parent('.virbox').find('span');
                    $spanArray.html('');
                    var val = jqLite(this).val();
                    showValue(val, $spanArray, inputType, 'keyup');
                })
                .on('keydown', function (event) {
                    if (event.which == 46) {
                        //清空
                        jqLite(this).val('');
                        var $spanArray = jqLite(this).parent('.virbox').find('span');
                        $spanArray.html('');
                        $timeout(function () {
                            scope.value = '';
                        });
                    }
                    else if (event.which == 8) {
                        var $spanArray = jqLite(this).parent('.virbox').find('span').html('');
                        var self = this;
                        $timeout(function () {
                            var val = jqLite(self).val();
                            showValue(val, $spanArray, inputType, 'keydown');
                        });
                    }

                    if (event.which >= 35 && event.which <= 40) {

                        return false;
                    }
                    if (inputType == 'number' && (event.which < 48 || event.which > 57)) {
                        return false;
                    }

                    return true;
                });
        }


        var directive = {
            link: link,
            restrict: 'A',
            scope: {value: '=ngModel',readonly:'=boxReadonly'}
        };
        return directive;

        function link(scope, element, attrs) {

            var length = attrs.maxlength || 6;
            var arrVirboxSpan = [];
            var inputType = attrs.type.toLowerCase();
            for(var i=0;i<length;i++) {
                arrVirboxSpan.push('<span></span>')
            }
            element.addClass('realbox').wrap('<div class="virbox"></div>');
            jqLite(arrVirboxSpan.join('')).insertAfter(element);

            if(!scope.readonly){
                bindEvents(scope,element,inputType);
            }
            else{
                unbindEvents(element);
            }

            scope.$watch('value', function (newValue, oldValue) {
                showValue(element.val(),element.parent('.virbox').find('span'),inputType,'watch-value');
            });

            scope.$watch('readonly', function (newValue, oldValue) {
                if (newValue != oldValue) {
                    console.log('lll');
                    console.log('newValue:' + newValue);
                    console.log('oldValue:' + oldValue);
                    if (!newValue) {
                        bindEvents(scope,element, inputType);
                    }
                    else {
                        unbindEvents(element);
                    }
                }
            });
            //console.log(element.val());

        }
    }

    //datetimePicker.$inject = [];
    function datetimePicker() {
        var directive = {
            link: link,
            restrict: 'A',
            require: '?ngModel',
            scope: {ngModel: '='}
        };
        return directive;

        function link(scope, element, attrs, ngModelCtl) {
            var options = scope.$eval(attrs.options);
            if (!options.locale) {
                options.locale = moment.locale('locale');
            }

            var $el = angular.element(element);
            $el.datetimepicker(options);
            var $elo = $el.data('DateTimePicker');

            $el.on("dp.show", function (e) {
                if(scope.ngModel == undefined) {
                    $elo.date(moment());
                }
            });

            $el.on("dp.change", function (e) {
                if(e.date && e.oldDate) {
                    scope.$apply(function(){
                        scope.ngModel =  e.date.toDate();
                    });
                }
            });

            scope.$watch('ngModel', function (newValue, oldValue) {
                if (newValue != oldValue) {
                    $elo.date(moment(newValue));
                    scope.$eval(attrs.ngModel + ' = ngModel');
                }
            });
        }
    }

})();

            vmh.http
                .get(subsystemURL)
                .success(function (treeNodes) {
                    //##import tip##
                    //单棵树
                    //vm.tree1 = new tree.sTree('tree1', treeNodes);
                    //过滤
                    //vmh.treeFactory.filter(treeNodes,function(node) {
                    //    console.log(node._id);
                    //    return node._id.indexOf('120502') != 0;
                    //});
                    //##import tip##
                    //多棵树
                    vm.trees = [new vmh.treeFactory.sTree('tree1', treeNodes), new vmh.treeFactory.sTree('tree2', treeNodes, {mode: 'check'})];
                });


            $scope.$on('tree:node:select', function ($event,node) {
                console.log(node);
            });
        }

    }

    DemoTreeExtendController.$inject = ['$scope','vmh', 'instanceVM'];

    function DemoTreeExtendController($scope, vmh, vm) {

        $scope.vm = vm;

        init();


        function init() {
            vm.init();

            var subsystemURL = 'server/district.json' + '?v=' + (new Date().getTime()); // jumps cache

            vmh.http
                .get(subsystemURL)
                .success(function (treeNodes) {

                    vm.trees = [new vmh.treeFactory.sTree('tree1', treeNodes),
                        new vmh.treeFactory.sTree('tree2', treeNodes, {mode: 'check', checkCascade: false})
                        ];//{expandLevel: 2}
                    //new vmh.treeFactory.sTree('tree3', angular.copy(treeNodes),{layout: 'dropdown',ngModel:'vm.field'})

                    //vm.trees[0].selectedNode = vm.trees[0].findNode('0-2-1'); //by $index
                    vm.trees[0].selectedNode = vm.trees[0].findNodeById('120404');//by _id
                    //vm.trees[0].setNodeChecked([vm.trees[0].findNodeById('120103'),vm.trees[0].findNodeById('120304')]);
                    vm.trees[1].checkedNodes = [vm.trees[1].findNodeById('1201'), vm.trees[1].findNodeById('120304'), vm.trees[1].findNodeById('120305')];



                });



            $scope.$on('tree:node:select', function ($event, node) {
                //console.log(node);
            });
        }

    }

    DemoTreeDirectiveController.$inject = ['$scope','vmh', 'instanceVM'];

    function DemoTreeDirectiveController($scope, vmh, vm) {

        $scope.vm = vm;

        init();


        function init() {
            vm.init();

            var subsystemURL = 'server/district.json' + '?v=' + (new Date().getTime()); // jumps cache

            vm.treeDataPromise = vmh.http.get(subsystemURL).then(function(res){
                vm.selectedDistrict = '120101';

                vm.checkedDistricts = ['120201','120203'];

                vm.selectedDistrictOfDropDown = ['120301','120304'];

                return res.data;
            });



            $scope.$on('tree:node:select', function ($event,node) {
                console.log(node);
            });
        }

    }

    DemoTreeNavController.$inject = ['$scope','vmh', 'instanceVM'];

    function DemoTreeNavController($scope, vmh, vm) {

        $scope.vm = vm;

        init();


        function init() {
            vm.init();

            var subsystemURL = 'server/district.json' + '?v=' + (new Date().getTime()); // jumps cache

            vm.treeDataPromise = vmh.http.get(subsystemURL).then(function(res){
                vm.selectedDistrict = '120101';

                return res.data;
            });



            $scope.$on('tree:node:select', function ($event,node) {
                console.log(node);
            });
        }

    }

    DemoTreeTileController.$inject = ['$scope','vmh', 'instanceVM'];

    function DemoTreeTileController($scope, vmh, vm) {

        $scope.vm = vm;

        init();


        function init() {
            vm.init();

            var subsystemURL = 'server/district.json' + '?v=' + (new Date().getTime()); // jumps cache

            vm.treeDataPromise = vmh.http.get(subsystemURL).then(function(res){
                vm.selectedDistrict = '120101';

                return res.data;
            });



            $scope.$on('tree:node:select', function ($event,node) {
                console.log(node);
            });
        }

    }

    DemoIMGProcessQiNiuController.$inject = ['$scope','vmh', 'instanceVM','Auth'];
    function DemoIMGProcessQiNiuController($scope, vmh, vm,Auth) {
        $scope.vm = vm;

        init();

        function init() {
            vm.init();
            vm.user_code = Auth.getUser().code;
            
        }
    }

    DemoDropdownController.$inject = ['$scope','vmh', 'instanceVM'];

    function DemoDropdownController($scope, vmh, vm) {

        $scope.vm = vm;

        init();


        function init() {
            vm.init();
            vm.dropdownDataPromise = vmh.shareService.d('D1015').then(function(items){
                //vm.period = items[2].value;
                return items;
            });

            vm.onSelect = onSelect;

            vm.makeEmpty = makeEmpty;
        }

        function onSelect(item){
            vm.selected = 'callback received ' + angular.toJson(item);
        }

        function makeEmpty(){
            vm.period = '';
        }
    }

    DemoBoxInputController.$inject = ['$scope','vmh', 'instanceVM'];

    function DemoBoxInputController($scope, vmh, vm) {

        $scope.vm = vm;

        init();


        function init() {
            vm.init();


            vmh.shareService.d('D1006').then(function(sexes){
                vm.selectBinding.sex = sexes;
            });

        }

    }

    DemoPromiseController.$inject = ['$scope','vmh', 'instanceVM'];
    function DemoPromiseController($scope, vmh, vm) {

        $scope.vm = vm;

        init();


        function init() {
            vm.init();

            var p1 = vmh.q.when(true);
            var p2 = vmh.q.when(false).then(function (ret) {
                return vmh.q.when(true);
            });

            var f = function () {
                return vmh.debugService.tenantInfo('56cedebf7768e0eb161e1787','name');
            };

            var p3 = f();
            vmh.q.all([p1, p2,p3]).then(function (ret) {
                console.log(ret);
            });
        }

    }

})();
