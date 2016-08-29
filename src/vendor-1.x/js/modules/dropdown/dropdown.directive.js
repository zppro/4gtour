/**
 * utils.directive Created by zppro on 16-3-24.
 */

(function() {
    'use strict';

    angular
        .module('app.dropdown')
        .directive('sDropdown', sDropdown)
    ;

    sDropdown.$inject = ['$q'];
    function sDropdown($q) {
        var directive = {
            restrict: 'EA',
            templateUrl: function (elem, attrs) {
                return attrs.dropdownTemplateUrl || 'dropdown-default-renderer.html'
            },
            link: link,
            scope: {sDropdownData: '=', onSelect: '&', model: '=ngModel', emptyPlaceholder: '='}
        };
        return directive;

        function link(scope, element, attrs) {

            var data = scope.sDropdownData;

            if (!data) {
                return;
            }
            var option = scope.$eval(attrs.sDropdownOption) || {};
            var selectItemFormat = option.selectItemFormat || 'value';
            var valueKey = option.valueKey || 'value';
            var textKey = option.textKey || 'name';

            // Bring in changes from outside:
            scope.$watch('model', function(newValue,oldValue) {

                if (newValue != oldValue) {
                    scope.$eval(attrs.ngModel + ' = model');
                    setShowText();
                }
            });

            // Send out changes from inside:
            //scope.$watch(attrs.ngModel, function(val) {
            //    scope.model = val;
            //});

            scope.showText = scope.emptyPlaceholder || '请选择';


            scope.isButton = 'isButton' in attrs;

            element.on('click', function (event) {
                event.preventDefault();
            });

            scope.select = function (item) {
                scope.model = selectItemFormat == 'object' ? item : item[valueKey];
                if (scope.onSelect) {
                    scope.onSelect({item: item});
                }
            };

            $q.when(data).then(function (items) {
                if (items == data) {
                    //console.log('raw data')
                    //取数据构建树对象
                }
                else {
                    //console.log('promise data')

                }
                scope.items = items;

                setShowText();
            });

            function setShowText() {
                for (var i = 0; i < scope.items.length; i++) {

                    if (selectItemFormat == 'object') {
                        if (scope.items[i] == scope.model || scope.items[i][valueKey] == scope.model[valueKey]) {
                            scope.showText = scope.items[i][textKey];
                            break;
                        }
                    }
                    else {

                        if (scope.items[i][valueKey] == scope.model) {
                            scope.showText = scope.items[i][textKey];
                            break;
                        }
                    }
                }
            }
        }
    }

})();
