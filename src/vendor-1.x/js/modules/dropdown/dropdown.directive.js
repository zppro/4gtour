/**
 * utils.directive Created by zppro on 16-3-24.
 */

(function() {
    'use strict';

    angular
        .module('app.dropdown')
        .directive('sDropdown', sDropdown)
    ;

    sDropdown.$inject = ['$q', '$timeout'];
    function sDropdown($q, $timeout) {


        var directive = {
            restrict: 'EA',
            templateUrl: function (elem, attrs) {
                return attrs.dropdownTemplateUrl || 'dropdown-default-renderer.html';
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
                console.log(newValue)
                console.log(oldValue)
                if (newValue != oldValue) {
                    scope.$eval(attrs.ngModel + ' = model');
                    setShowText();
                }
            });

            // Send out changes from inside:
            //scope.$watch(attrs.ngModel, function(val) {
            //    scope.model = val;
            //});



            scope.isButton = 'isButton' in attrs;

            element.on('click', function (event) {
                event.preventDefault();
            });

            scope.select = function (item) {
                scope.model = selectItemFormat == 'object' ? item : item[valueKey];
                if (scope.onSelect) {
                    $timeout(function () {
                        scope.onSelect({item: item});
                    }, 0);
                }
            };
            $q.when(data).then(function (items) {
                scope.items = items;

                setShowText();
            });

            function setShowText() {
                scope.showText = scope.emptyPlaceholder || '请选择';
                if (scope.items) {
                    for (var i = 0; i < scope.items.length; i++) {
                        if (selectItemFormat == 'object') {
                            if (scope.model && scope.items[i] == scope.model) { //|| (valueKey && scope.items[i][valueKey] == scope.model[valueKey])
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
    }

})();
