/**
 * tree.module Created by zppro on 16-3-26.
 * Target:用途
 */
(function() {
    'use strict';

    angular
        .module('app.dropdown')
        .run(dropdownRun);
    ;

    dropdownRun.$inject = ['$templateCache'];

    function dropdownRun($templateCache) {
        var templateContent = '<div dropdown="dropdown" class="btn-group">\
            <button type="button" ng-if="isButton" ng-bind="showText" class="btn btn-primary"></button>\
            <button type="button" ng-if="isButton" dropdown-toggle="dropdown-toggle" class="btn btn-primary dropdown-toggle"><span class="caret"></span></button><a ng-if="!isButton" ng-bind="showText" dropdown-toggle="dropdown-toggle" class="dropdown-toggle"></a><span ng-if="!isButton" class="caret"></span>\
        <ul role="menu" class="dropdown-menu">\
            <li ng-repeat="item in items"><a href="#" ng-bind="item.name" ng-click="select(item)"></a></li>\
        </ul>\
        </div>';
        $templateCache.put("dropdown-default-renderer.html",templateContent);

    }
})();