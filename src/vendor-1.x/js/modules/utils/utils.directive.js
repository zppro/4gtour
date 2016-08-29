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
