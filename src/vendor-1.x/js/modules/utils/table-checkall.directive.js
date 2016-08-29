/**=========================================================
 * Module: table-checkall.js
 * Tables check all checkbox
 =========================================================*/
(function() {
    'use strict';

    angular
        .module('app.utils')
        .directive('checkAll', checkAll);

    function checkAll () {
        var directive = {
            link: link,
            restrict: 'A'
        };
        return directive;

        function link(scope, element) {
            element.on('change', function () {
                var $this = $(this),
                    index = $this.index() + 1,
                    checkbox = $this.find('input[type="checkbox"]'),
                    table = $this.parents('table');
                // Make sure to affect only the correct checkbox column
                table.find('tbody > tr > td:nth-child(' + index + ') input[type="checkbox"]')
                    .prop('checked', checkbox[0].checked);

            });

            scope.$watch('vm.page.no', function (newPage, oldPage) {
                if (newPage != oldPage) {
                    var $el = angular.element(element),
                        table = $el.parents('table'),
                        index = $el.index() + 1,
                        checkbox = $el.find('input[type="checkbox"]');

                    checkbox.prop('checked',false);
                    table.find('tbody > tr > td:nth-child(' + index + ') input[type="checkbox"]')
                        .prop('checked', false);
                    _.each(scope.vm.selectedRows,function(row) {
                        row.checked = false;
                    });
                    scope.vm.selectedRows=[];//如果不加这行可以实现翻页选中效果
                }
            });
        }
    }

})();
