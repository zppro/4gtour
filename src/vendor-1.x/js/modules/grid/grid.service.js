(function() {
    'use strict';

    angular
        .module('app.grid')
        .service('GridDemoModelSerivce', GridDemoModelSerivce)
        .service('GridUtils',GridUtils)
        .factory('GridFactory',GridFactory)
    ;

    GridFactory.$inject = ['modelNode','$q','$filter'];
    function GridFactory(modelNode,$q,$filter) {
        return {
            buildGrid: function (option) {
                return new Grid(option,modelNode,$q,$filter);
            }
        }
    }


    function Grid(option,modelNode,$q,$filter) {
        var self = this;
        this.page = angular.extend({size: 9, no: 1}, option.page);
        this.sort = {
            column: option.sortColumn || '_id',
            direction: option.sortDirection ||-1,
            toggle: function (column) {
                if (column.sortable) {
                    if (this.column === column.name) {
                        this.direction = -this.direction || -1;
                    } else {
                        this.column = column.name;
                        this.direction = -1;
                    }

                    self.paging();
                }
            }
        };
        this.searchForm = option.searchForm;
        this.rows = [];
        this.rawData = [];
        this.modelling = false;

        //必须有的
        this.model = option.model;

        if (angular.isString(this.model)) {
            this.model = modelNode.services[this.model];
        }

        if (!this.model)
            this.model = angular.noop;

        var promise;
        if (angular.isFunction(this.model)) {
            this.model = this.model();
        }

        promise = $q.when(this.model).then(function (ret) {

            if (angular.isArray(ret)) {
                self.rawData = ret;
            }
            else {
                self.modelling = true;
            }

            self.setData = setData;
            self.query = query;
            self.paging = paging;

            return self;
        });

        return promise;


        function setData(data) {
            self.rawData = data;
        }


        function query(param) {
            var queryParam = angular.extend({}, self.searchForm, param);
            if (self.modelling) {
                self.rows = self.model.page(self.page, queryParam, null, (self.sort.direction > 0 ? '' : '-') + self.sort.column);
                //服务端totals在查询数据时计算
                self.model.totals(queryParam).$promise.then(function (ret) {
                    self.page.totals = ret.totals;
                });
            }
            else {
                if (self.rawData)
                    self.rows = $filter('filter')(self.rawData, queryParam);
            }
        }

        function paging() {
            if (this.modelling) {
                this.query();
            }
        }
    }

    GridDemoModelSerivce.$inject = ['Utils'];
    function GridDemoModelSerivce(Utils) {

        this.query = query;
        this.find = find;
        this.one = one;
        this.save = save;
        this.update = update;
        this.remove = remove;
        this._demoData_ = [];

        function query(refresh) {
            refresh = this._demoData_.length == 0 || refresh;

            if (refresh) {
                this._demoData_.length = 0;
                var MAX_NUM = 10 * 50;
                for (var i = 0; i < MAX_NUM; ++i) {
                    var id = Utils.rand(0, MAX_NUM);
                    this._demoData_.push({
                        id: i + 1,
                        name: 'Name' + id, // 字符串类型
                        followers: Utils.rand(0, 100 * 1000 * 1000), // 数字类型
                        birthday: moment().subtract(Utils.rand(365, 365 * 50), 'day').toDate(), // 日期类型
                        summary: '这是一个测试' + i,
                        income: Utils.rand(1000, 100000) // 金额类型
                    });
                }
            }

            return this._demoData_;
        }


        function one(properties) {
            return _.findWhere(this._demoData_, properties);
        }

        function find(id) {
            return _.find(this._demoData_, function (item) {
                return item.id == id;
            });
        }

        ///为了保证何$resource中的save功能一样此方法用于添加
        function save(data) {
            //添加
            this._demoData_.push(_.defaults(data, {}));
            //if (id != 'new') {
            //    //修改
            //    var dest = _.bind(find, this, id);
            //    _.extend(dest, data);
            //}
            //else {
            //
            //}
        }

        function update(id,data){
            var dest = _.bind(find, this, id);
            _.extend(dest, data);
        }

        function remove(ids) {
            console.log(this._demoData_.length);
            this._demoData_ = _.reject(this._demoData_, function (item) {
                return _.contains(ids, item.id);
            });

            console.log(this._demoData_.length);
        }
    }

    GridUtils.$inject = ['$filter','ViewUtils'];
    function GridUtils($filter,ViewUtils) {
        return {
            paging: paging,
            totals: totals,
            hide: hide,
            width: width,
            toggleOrderClass: toggleOrderClass,
            noResultsColspan: noResultsColspan,
            revertNumber: revertNumber,
            calcAge: calcAge,
            formatter: formatter,
            populateFilter: populateFilter,
            boolFilter: boolFilter,
            diFilter: diFilter,
            repeatInfoCombo: repeatInfoCombo,
            orFilter: orFilter
        };

        function paging(items, vm) {
            if (!items)
                return [];

            if(vm.serverPaging){
                //服务端分页
                vm.paged = items;
            }
            else{
                //客户端分页
                var offset = (vm.page.no - 1) * vm.page.size;
                vm.paged = items.slice(offset, offset + vm.page.size);

                ////客户端totals在分页数据时计算
                vm.page.totals = items.length;//客户端分页是立即触发结果
            }
            return vm.paged;
        }

        function totals(items,filter,vm) {
            if (!items)
                return 0;
            if (vm.serverPaging) {
                //服务端分页
                return vm.page.totals;
            }
            else {
                //客户端分页

                return items.length || 0
            }
        }

        function hide(column) {
            if (!column)
                return true;
            return column.hidden === true;
        }

        function width(column) {
            if (!column)
                return 0;
            return column.width || 100;
        }

        function toggleOrderClass(direction) {
            if (direction === -1)
                return "glyphicon-chevron-down";
            else
                return "glyphicon-chevron-up";
        }

        function noResultsColspan(vm) {
            if (!vm || !vm.columns)
                return 1;
            return 1 + vm.columns.length - _.where(vm.columns, {hidden: true}).length;
        }


        function revertNumber(num,notConvert) {
            if (num && !notConvert) {
                return -num;
            }
            return num;
        }

        function calcAge(rowValue) {
            return ViewUtils.age(rowValue)
        }

        function formatter(rowValue, columnName, columns) {
            var one = _.findWhere(columns, {name: columnName});

            if(one && !one.hidden) {
                if (one.formatterData) {

                    if(_.isArray(rowValue)){
                        return _.map(rowValue,function(o){
                            return one.formatterData[o];
                        });
                    }
                    else{
                        return one.formatterData[rowValue];
                    }
                }
            }
            return rowValue;
        }

        
        
        function populateFilter(rowValue, key) {
            key = key || 'name';
            if(_.isArray(rowValue)){
                return _.map(rowValue,function(o){
                    console.log(o);
                    return ViewUtils.getPropery(o, key);
                });
            }
            else{
                return ViewUtils.getPropery(o, key);
            }
            return rowValue;
        }

        function boolFilter(rowValue){
            return {"1": "是", "0": "否", "true": "是", "false": "否"}[rowValue];
        }

        function diFilter(rowValue,di) {
            if (_.isArray(rowValue)) {
                return _.map(rowValue, function (o) {
                    return di[o] || (_.findWhere(di, {value: rowValue}) || {}).name;
                });
            }
            else {
                return di[rowValue] || (_.findWhere(di, {value: rowValue}) || {}).name;
            }
        }

        function repeatInfoCombo(repeatValues, repeat_start) {
            if (_.isArray(repeatValues) && repeatValues.length > 0) {
                return _.map(repeatValues, function (r) {
                    return r + repeat_start;
                }).join('\r\n');
            } else {
                return repeat_start;
            }
        } 

        /**
         * AngularJS default filter with the following expression:
         * "person in people | filter: {name: $select.search, age: $select.search}"
         * performs a AND between 'name: $select.search' and 'age: $select.search'.
         * We want to perform a OR.
         */
        function orFilter(items, props) {
            var out = [];

            if (_.isArray(items)) {
                _.each(items,function (item) {
                    var itemMatches = false;

                    var keys = Object.keys(props);
                    for (var i = 0; i < keys.length; i++) {
                        var prop = keys[i];
                        var text = props[prop].toLowerCase();
                        if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                            itemMatches = true;
                            break;
                        }
                    }

                    if (itemMatches) {
                        out.push(item);
                    }
                });
            } else {
                // Let the output be the input untouched
                out = items;
            }

            return out;
        };
    }
})();