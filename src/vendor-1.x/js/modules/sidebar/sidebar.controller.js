/**=========================================================
 * Module: sidebar-menu.js
 * Handle sidebar collapsible elements
 =========================================================*/

(function() {
    'use strict';

    angular
        .module('app.sidebar')
        .controller('SidebarController', SidebarController);

    SidebarController.$inject = ['$rootScope', '$scope', '$state', '$timeout','SidebarLoader', 'Utils', 'Auth','SETTING_KEYS','SettingsManager'];
    function SidebarController($rootScope, $scope, $state, $timeout,SidebarLoader, Utils, Auth,SETTING_KEYS,SettingsManager) {

        activate();
        ////////////////

        function activate() {
            var collapseList = [];

            // demo: when switch from collapse to hover, close all items
            $rootScope.$watch('app.layout.asideHover', function (oldVal, newVal) {
                if (newVal === false && oldVal === true) {
                    closeAllBut(-1);
                }
            });


            // Load subsystem from json file
            // -----------------------------------
            $scope.subsystem = {
                listIsOpen: false,
                init: function () {
                    var self = this;
                    SidebarLoader.getSubsystem(function (items) {
                        items = _.filter(items,checkUserType);
                        console.log(items)
                        items = _.filter(items, Auth.isSubsystemPermit);
                        $scope.subsystem.available = _.filter(items,checkAuthorition);
                        angular.forEach($scope.subsystem.available, function (item) {
                            if (self.isActive(item)) {
                                $scope.subsystem.selected = item;
                            }
                        });

                        if(!$scope.subsystem.selected && $scope.subsystem.available.length>0) {
                            $scope.subsystem.selected = $scope.subsystem.available[0];
                        }

                        if ($scope.subsystem.selected) {
                            // Load menu from json file
                            SidebarLoader.getMenu($scope.subsystem.selected, sidebarReady);

                            var settings = SettingsManager.getSubsystemInstance($scope.subsystem.selected.sref);
                            settings &&  SettingsManager.setCurrentInstance(settings);
                            settings && settings.write(SETTING_KEYS.CURRENT_SUBSYSTEM,$scope.subsystem.selected);

                            $scope.subsystem.selected.mtype != 'demo' && $rootScope.$emit('sidebar:subsystem:change');


                        }
                    });
                },
                switchSubsystem: function (item) {
                    $scope.subsystem.selected = item;
                    SidebarLoader.getMenu($scope.subsystem.selected, sidebarReady);
                    var settings = SettingsManager.getSubsystemInstance($scope.subsystem.selected.sref);
                    settings &&  SettingsManager.setCurrentInstance(settings);
                    settings && settings.write(SETTING_KEYS.CURRENT_SUBSYSTEM,$scope.subsystem.selected);

                    $scope.subsystem.selected.mtype != 'demo' && $rootScope.$emit('sidebar:subsystem:change');
                },
                isActive: function (item) {
                    if (!item) return;
                    return $state.is(item.sref) || $state.includes(item.sref);
                }
            };
            $scope.subsystem.init();


            function sidebarReady(items) {

                var permitItemsOfLevelOne = _.filter(items,function(item){

                    return checkPermit(item);
                });

                _.each(permitItemsOfLevelOne,function(item1){
                    if(item1.children){
                        _.each(item1.children,function(item2){
                            if(item2.params) {
                                item2.params = angular.fromJson(item2.params);
                            }
                        });
                    }
                });
                //菜单中带参数如下
                ///{"sref": "app.manage-center.tenant-account-manage.list","params": "{\"types\":[\"A0001\",\"A0002\"]}"}}
                $scope.menuItems = permitItemsOfLevelOne;


                //打开第一层
                //$timeout(function(){
                //    _.each($scope.menuItems,function(item,i){
                //        if(item.children){
                //            console.log(i);
                //            if(i==0) {
                //                console.log(item);
                //                $scope.toggleCollapse(i, true);
                //            }
                //        }
                //    });
                //},2000);

            }

            $scope.$on('ngRepeatFinished:sidebar-group', function($event) {
                if($state.current.name == 'app.dashboard') {
                    _.each($scope.menuItems, function (item, i) {

                        if (item.children) {
                            if (i == 0) {
                                $scope.toggleCollapse(i, true);
                            }
                        }
                    });
                }
            });

            // Handle sidebar and collapse items
            // ----------------------------------

            $scope.getMenuItemPropClasses = function (item) {
                return (item.heading ? 'nav-heading' : '') +
                    (isActive(item) ? ' active' : '');
            };

            $scope.addCollapse = function ($index, item) {
                collapseList[$index] = $rootScope.app.layout.asideHover ? true : !isActive(item);
            };

            $scope.isCollapse = function ($index) {
                return (collapseList[$index]);
            };


            function checkUserType(item) {
                return _.contains(item.usertype, Auth.getUser().type);
            }
            
            //可以检测subsystem和menu
            function checkAuthorition(item) {
                if (!item.sref || item.sref == '#') {
                    //父节点
                    if (item.children) {
                        return _.some(item.children, checkAuthorition);
                    }
                    else {
                        return false;
                    }
                }
                else {
                    var state = $state.get(item.sref) || {};
                    return Auth.isAuthorized(state.access_level || 0);
                }
            }

            function checkPermit(item){
                if (!item.sref || item.sref == '#') {
                    if (item.children) {
                        return _.some(item.children, checkPermit);
                    }
                    else {
                        return false;
                    }
                }
                else{
                    return  Auth.isPermit(item._id);
                }
            }


            $scope.isPermit = checkPermit;
            $scope.isAuthorized = checkAuthorition;

            $scope.toggleCollapse = function ($index, isParentItem) {

                // collapsed sidebar doesn't toggle drodopwn
                if (Utils.isSidebarCollapsed() || $rootScope.app.layout.asideHover) return true;

                // make sure the item index exists
                if (angular.isDefined(collapseList[$index])) {
                    if (!$scope.lastEventFromChild) {
                        collapseList[$index] = !collapseList[$index];
                        closeAllBut($index);
                    }
                }
                else if (isParentItem) {
                    closeAllBut(-1);
                }

                $scope.lastEventFromChild = isChild($index);

                return true;

            };

            // Controller helpers
            // -----------------------------------

            // Check item and children active state
            function isActive(item) {

                if (!item) return;

                if (!item.sref || item.sref === '#') {
                    var foundActive = false;
                    angular.forEach(item.children, function (value) {
                        if (isActive(value)) foundActive = true;
                    });
                    return foundActive;
                }
                else
                    return $state.is(item.sref) || $state.includes(item.sref);
            }

            function closeAllBut(index) {
                index += '';
                for (var i in collapseList) {
                    if (index < 0 || index.indexOf(i) < 0)
                        collapseList[i] = true;
                }
            }

            function isChild($index) {
                /*jshint -W018*/
                return (typeof $index === 'string') && !($index.indexOf('-') < 0);
            }

        } // activate
    }

})();
