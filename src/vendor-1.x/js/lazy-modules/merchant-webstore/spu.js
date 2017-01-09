/**
 * Created by zppro on 17-1-9.
 * Target:web商城 SPU
 */

(function() {
    'use strict';

    angular
        .module('subsystem.merchant-webstore.spu',[])
        .controller('SPUGridController', SPUGridController)
        .controller('SPUDetailsController', SPUDetailsController)
    ;

    SPUGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function SPUGridController($scope, ngDialog, vmh, vm) {
        console.log(3456)
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

    SPUDetailsController.$inject = ['$scope', 'ngDialog', 'vmh', 'entityVM'];

    function SPUDetailsController($scope, ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;


        init();

        function init() {

            vm.init({removeDialog: ngDialog});

            vm.doSubmit = doSubmit;
            vm.checkSKUAll = checkSKUAll;
            vm.addSKU = addSKU;
            vm.editSKU = editSKU;
            vm.saveSKU = saveSKU;
            vm.cancelSKU = cancelSKU;
            vm.removeSKU = removeSKU;
            
            vm.tab1 = {cid: 'contentTab1',active:true};

            vm.treeDataPromise = vmh.shareService.t('district').then(function(nodes){
                vm.load();
                return nodes;
            });

        }

        function checkSKUAll($event) {
            var rowCheckState = true;
            if ($event.target.tagName == "INPUT" && $event.target.type == "checkbox") {
                var $checkbox = angular.element($event.target);
                rowCheckState = $checkbox.prop('checked');
            }

            for(var i=0;i<vm.model.skus.length;i++) {
                vm.model.skus[i].checked = rowCheckState;
            }
        }

        function addSKU() {
            if (!vm.$gridEditingOfSKU) {
                vm.model.skus.push({isNew: true, $editing: true})
                vm.$gridEditingOfSKU = true;
            }
        }

        function editSKU(row) {
            vm.editingRow = angular.copy(row);
            row.$editing = true;
            vm.$gridEditingOfSKU = true;
        }

        function saveSKU(row) {
            if(row.isNew) {
                row.isNew = false;
            }
            else{
                vm.editingRow = null;
            }
            row.$editing = false;
            vm.$gridEditingOfSKU = false;
        }

        function cancelSKU(row) {
            if(row.isNew) {
                vm.model.skus.splice(vm.model.skus.length - 1, 1);
            }
            else {
                _.extend(row, vm.editingRow);
            }
            row.$editing = false;
            vm.$gridEditingOfSKU = false;
        }

        function removeSKU() {
            var haveSelected = _.some(vm.model.skus, function (row) {
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
                for(var i=0;i<vm.model.skus.length;i++) {
                    var row = vm.model.skus[i];
                    if (row.checked) {
                        vm.model.skus.splice(i, 1);
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
