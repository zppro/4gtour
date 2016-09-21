/**
 * Created by zppro on 16-3-22.
 */

(function() {
    'use strict';

    angular
        .module('subsystem.manage-center.tenant-order-manage',[])
        .controller('TenantOrderManageGridController', TenantOrderManageGridController)
        .controller('TenantOrderManageDetailsController', TenantOrderManageDetailsController)
    ;


    TenantOrderManageGridController.$inject = ['$scope', 'ngDialog', 'vmh', 'entryVM'];

    function TenantOrderManageGridController($scope, ngDialog, vmh, vm) {
        $scope.vm = vm;
        $scope.utils = vmh.utils.g;
        var vmc = $scope.vmc = {};

        init();


        function init() {
            vm.init({removeDialog: ngDialog});

            vmh.translate(vm.viewTranslatePath('COMPLETE-ORDER-COMMENT')).then(function (ret) {
                $scope.dialogData = {details: ret};
            });

            if (vm.switches.leftTree) {
                vmh.shareService.tmp('T3001/pub-tenant', 'name type', vm.treeFilterObject).then(function (treeNodes) {
                    vm.trees = [new vmh.treeFactory.sTree('tree1', treeNodes, {mode: 'grid'})];
                    vm.trees[0].selectedNode = vm.trees[0].findNodeById($scope.$stateParams.tenantId);
                });

                $scope.$on('tree:node:select', function ($event, node) {
                    //console.log(tree.selectedNode);
                    var selectNodeId = node._id;
                    if ($scope.$stateParams.tenantId != selectNodeId) {
                        $scope.$state.go(vm.viewRoute(), {tenantId: selectNodeId});

                    }
                });
            }
            vm.query();

            vmc.submitOrder = submitOrder;
            vmc.completeOrder = completeOrder;
        }

        function submitOrder(row) {
            ngDialog.openConfirm({
                template: 'normalConfirmDialog.html',
                className: 'ngdialog-theme-default'
            }).then(function () {
                //A1001->A1002 订单状态从[等待客户提交]到[等待客户付款]
                var data = {order_status: 'A1002'};
                var promise = vm.modelService.update(row._id, data).$promise.then(function () {
                    row.order_status = data.order_status;
                });

                vmh.q.all([vmh.translate('notification.NORMAL-SUCCESS'), promise]).then(function (ret) {
                    vmh.notify.alert('<div class="text-center"><em class="fa fa-check"></em> ' + ret[0] + '</div>', 'success');
                });
            });
        }



        function completeOrder(row) {
            ngDialog.openConfirm({
                template: 'normalConfirmDialog.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            }).then(function () {
                var promise = vmh.extensionService.completeOrder(row._id).then(function (ret) {
                    row = _.extend(row, ret);
                });;

                vmh.q.all([vmh.translate('notification.NORMAL-SUCCESS'), promise]).then(function (ret) {
                    vmh.notify.alert('<div class="text-center"><em class="fa fa-check"></em> ' + ret[0] + '</div>', 'success');
                });
            });
        }
    }

    TenantOrderManageDetailsController.$inject = ['$scope','$interpolate','ngDialog', 'vmh','entityVM'];

    function TenantOrderManageDetailsController($scope,$interpolate,ngDialog, vmh, vm) {

        var vm = $scope.vm = vm;
        $scope.utils = vmh.utils.v;
        var vmc = $scope.vmc = {};
        var tenantService = vm.modelNode.services['pub-tenant'];

        init();

        function init() {

            vm.init({removeDialog: ngDialog});

            vmh.translate(vm.viewTranslatePath('REFUND-ORDER-COMMENT')).then(function (ret) {
                $scope.dialogData = {details: ret};
            });

            vmh.translate([vm.viewTranslatePath('ORDER-ITEM-COMMENT-1'),vm.viewTranslatePath('ORDER-ITEM-COMMENT-2')]).then(function (ret) {
                vmc.translateOrderItemComment = ret;
            });

            if (vm.selectFilterObject.tenants) {
                vm.selectBinding.tenants = tenantService.query(vm.selectFilterObject.tenants, '_id name');
            }
            //vmh.shareService.d('D1001').then(function (rows) {
            //    vm.selectBinding.roles = rows;
            //});

            vm.doSubmit = doSubmit;
            vm.tab1 = {cid: 'contentTab1'};
            //vm.tab2 = {cid: 'contentTab2'};

            vm.registerFieldConverter('tenantId', fieldConvertToTenantId);


            vmc.onTenantIdChanged = onTenantIdChanged;
            vmc.refundOrder = refundOrder;
            vmc.orderItemComment = orderItemComment;

            vmh.clientData.getJson('subsystem').then(function (items) {
                var businessSubsystems = _.where(items, {mtype: 'business'});
                var getMenuPromises = _.map(businessSubsystems, function (subsystem) {
                    return vmh.clientData.getJson(subsystem.menujson)
                });

                getMenuPromises.push(vm.load());

                vmh.parallel(getMenuPromises).then(function (results) {
                    vmc.totalFuncs = [];
                    for (var i = 0; i < getMenuPromises.length - 1; i++) {
                        vmc.totalFuncs = _.union(vmc.totalFuncs, results[i]);
                    }


                    onTenantIdChanged();

                });
            });


            $scope.$on('tree:node:checkChange', function ($event, checkedNodes) {
                vm.model.period_charge = 0;
                vm.model.order_items = [];
                for (var i = 0; i < checkedNodes.length; i++) {
                    var theFunc = _.findWhere(vmc.pricedFuncs, {func_id: checkedNodes[i]._id});
                    if (theFunc) {
                        vm.model.period_charge += theFunc.price;
                        vm.model.order_items.push(_.omit(theFunc, ['_id', 'check_in_time']));
                    }
                }
            });

        }

        function fieldConvertToTenantId() {
            var tenant = _.findWhere(vm.selectBinding.tenants, {_id: vm.model.tenantId});
            return (tenant || {}).name || vm.model.tenantId;
        }

        function onTenantIdChanged() {

            if (vm.model.tenantId) {

                vmh.fetch(tenantService.query({_id: vm.model.tenantId}, 'price_funcs open_funcs')).then(function (currentTenant) {
                    vmc.pricedFuncs = currentTenant[0].price_funcs;
                    vmc.open_funcs = currentTenant[0].open_funcs;

                    console.log(vmc.totalFuncs);
                    console.log(vmc.pricedFuncs);

                    var pricedFuncIds = _.map(vmc.pricedFuncs, function (o) {
                        return o.func_id;
                    });

                    var orderedFuncsIds = _.map(vm.model.order_items,function(o){
                        return o.func_id;
                    });

                    vmh.treeFactory.pick(vmc.totalFuncs, function (theFunc) {
                        return _.contains(vm.readonly ? orderedFuncsIds : pricedFuncIds, theFunc._id);
                    });

                    if(vmc.totalFuncs.length>0) {
                        var treeMode = vm.readonly ? 'select' : 'check';
                        vm.trees = [new vmh.treeFactory.sTree('tree1', vmc.totalFuncs, {mode: treeMode})];
                        _.each(vmc.pricedFuncs, function (o) {
                            var node = vm.trees[0].findNodeById(o.func_id);
                            if (node) {
                                node.template = 'order-item-renderer.html';
                                node.data = '(￥' + o.price + ')';
                            }
                        });

                        vm.trees[0].checkedNodes = _.map(vm.model.order_items, function (o) {
                            return vm.trees[0].findNodeById(o.func_id);
                        }).sort(function (node1, node2) {
                            return node1.attrs.orderNo - node2.attrs.orderNo
                        });
                    }

                });

            }
        }

        function orderItemComment(func_id) {
            var ret = '';
            var open_func = _.findWhere(vmc.open_funcs, {func_id: func_id});
            if (open_func && open_func.expired_on ) {
                var expired_on = moment(open_func.expired_on);
                if (expired_on.year() != 1970) {
                    ret = vmc.translateOrderItemComment[vm.viewTranslatePath('ORDER-ITEM-COMMENT-1')] + expired_on.format('l');
                }
                else {
                    ret = vmc.translateOrderItemComment[vm.viewTranslatePath('ORDER-ITEM-COMMENT-2')];
                }
            }
            //ret += '本订单生效后将增加'+vm.model.duration+'个月,预计功能开通截止>'+moment(open_func.expired_on).add(vm.model.duration,'M').format('l');
            return ret;
        }

        function refundOrder() {
            ngDialog.openConfirm({
                template: 'normalConfirmDialog.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            }).then(function () {
                var promise = vmh.extensionService.refundOrder(vm.model._id).then(function (ret) {
                    vm.model = _.extend(vm.model, ret);
                });

                vmh.q.all([vmh.translate('notification.NORMAL-SUCCESS'), promise]).then(function (ret) {
                    vmh.notify.alert('<div class="text-center"><em class="fa fa-check"></em> ' + ret[0] + '</div>', 'success');
                });
            });
        }


        function doSubmit() {
            if ($scope.theForm.$valid) {
                vm.save();
            }
            else {
                if ($scope.utils.vtab(vm.tab1.cid)) {
                    vm.tab1.active = true;
                }
                //else if ($scope.utils.vtab(vm.tab2.cid)) {
                //    vm.tab2.active = true;
                //}
            }
        }
    }

})();
