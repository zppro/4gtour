/**
 * Created by zppro on 17-1-9.
 * Target:web商城 SPU
 */

(function() {
    'use strict';

    angular
        .module('subsystem.merchant-webstore.wx-app-config',[])
        .controller('MWS_wxAppConfigGridController', MWS_wxAppConfigGridController)
        .controller('MWS_wxAppConfigDetailsController', MWS_wxAppConfigDetailsController)
    ;

    MWS_wxAppConfigGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function MWS_wxAppConfigGridController($scope, ngDialog, vmh, vm) {
        $scope.vm = vm;
        $scope.utils = vmh.utils.g; 

        init();
        
        function init() {
            vm.init({removeDialog: ngDialog});


            // vmh.translate(vm.viewTranslatePath('RESET-USER-PASSWORD-COMMENT')).then(function (ret) {
            //     $scope.dialogData = {details: ret};
            // });
            vm.query();
        }
    }

    MWS_wxAppConfigDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function MWS_wxAppConfigDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;


        init();

        function init() {

            vm.init({removeDialog: ngDialog});

            vm.doSubmit = doSubmit;
            vm.checkTemplateAll = checkTemplateAll;
            vm.addTemplate = addTemplate;
            vm.editTemplate = editTemplate;
            vm.saveTemplate = saveTemplate;
            vm.cancelTemplate = cancelTemplate;
            vm.removeTemplate = removeTemplate;
            
            vm.tab1 = {cid: 'contentTab1',active:true};

            vm.load();
        }

        function checkTemplateAll($event) {
            var rowCheckState = true;
            if ($event.target.tagName == "INPUT" && $event.target.type == "checkbox") {
                var $checkbox = angular.element($event.target);
                rowCheckState = $checkbox.prop('checked');
            }

            for(var i=0;i<vm.model.templates.length;i++) {
                vm.model.templates[i].checked = rowCheckState;
            }
        }

        function addTemplate() {
            if (!vm.$gridEditingOfTemplate) {
                vm.model.templates.push({isNew: true, $editing: true})
                vm.$gridEditingOfTemplate = true;
            }
        }

        function editTemplate(row) {
            vm.editingRow = angular.copy(row);
            row.$editing = true;
            vm.$gridEditingOfTemplate = true;
        }

        function saveTemplate(row) {
            if(row.isNew) {
                row.isNew = false;
            }
            else{
                vm.editingRow = null;
            }
            row.$editing = false;
            vm.$gridEditingOfTemplate = false;
        }

        function cancelTemplate(row) {
            if(row.isNew) {
                vm.model.templates.splice(vm.model.templates.length - 1, 1);
            }
            else {
                _.extend(row, vm.editingRow);
            }
            row.$editing = false;
            vm.$gridEditingOfTemplate = false;
        }

        function removeTemplate() {
            var haveSelected = _.some(vm.model.templates, function (row) {
                return row.checked
            });
            if (!haveSelected) {

                return vmh.translate('notification.SELECT-NONE-WARNING').then(function (ret) {
                    vmh.notify.alert('<div class="text-center"><em class="fa fa-warning"></em> ' + ret + '</div>', 'warning');
                });
            }

            ngDialog.openConfirm({
                template: 'removeConfirmDialog.html',
                className: 'ngdialog-theme-default'
            }).then(function () {
                for(var i=0;i<vm.model.templates.length;i++) {
                    var row = vm.model.templates[i];
                    if (row.checked) {
                        vm.model.templates.splice(i, 1);
                        i--;
                    }
                }
            });
        }


        function doSubmit() {

            if ($scope.theForm.$valid) {
                if (vm.model.img) {
                    if (vm.model.imgs.length > 0) {
                        vm.model.imgs[0] = vm.model.img;
                    } else {
                        vm.model.imgs.push(vm.model.img);
                    }
                }
                vm.save();
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
            }
        } 
    }
    
})();
