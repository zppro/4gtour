(function() {
    'use strict';

    angular
        .module('app.tree')
        .run(treeRun)
        ;

    treeRun.$inject = ['$templateCache'];
    
    function treeRun($templateCache) {


        $templateCache.put("tree/dropdown.tpl.html","<div class=\"input-group\"><input type=\"text\" class=\"form-control\" ng-model=\"vm.field\" /><span class=\"input-group-btn\"><button type=\"button\" class=\"btn btn-primary\"><i class=\"glyphicon glyphicon-list\"></i></button></span></div>");

    }
})();