/**
 * dashboard Created by zppro on 16-12-2.
 * Target:系统管理员以上看的数据面板（俯瞰图）
 */
(function() {
    'use strict';

    angular
        .module('subsystem.organization-travel.dashboard',[])
        .controller('DashboardControllerOfOrganizationOfTravelController', DashboardControllerOfOrganizationOfTravelController)
    ;

    DashboardControllerOfOrganizationOfTravelController.$inject = ['$scope', '$echarts','extensionOfDashboardOfTenantNode','vmh', 'instanceVM'];

    function DashboardControllerOfOrganizationOfTravelController($scope, $echarts,extensionOfDashboardOfTenantNode,vmh, vm) {
        $scope.vm = vm;

        init();


        function init() {

            vm.init();
            getDeviceStatInfo();
            // elderlyAgeGroups();
            // roomVacancyRateMonthly();
            // roomCatagoryOfManTime();
            // roomCatagoryOfManTimeMonthly();
        }

        function getDeviceStatInfo(){
            extensionOfDashboardOfTenantNode.getDeviceStatInfo().then(function(ret){
                console.log(ret);
                vm.deviceStatInfo = ret;
            });
        }

        function elderlyAgeGroups(){
            extensionOfDashboardOfTenantNode.elderlyAgeGroups(vm.tenantId).then(function(rows){
                //data: ["60岁以下", "60-69岁", "70-79岁", '80岁及以上']//legend data
                //data: [
                //    {value: 335, name: '60岁以下'},
                //    {value: 310, name: '60-69岁'},
                //    {value: 234, name: '70-79岁'},
                //    {value: 135, name: '80岁及以上'}
                //],//serials data
                var titles = _.map(rows,function(o){return vm.moduleTranslatePath(o.title);});
                var values = _.map(rows,function(o){return o.value;});
                var key_chart_title_elderlyagegroups = vm.moduleTranslatePath('CHART-TITLE-ELDERLY-AGE-GROUPS');
                var key_chart_serie_name_elderlyagegroups = vm.moduleTranslatePath('CHART-SERIE-NAME-ELDERLY-AGE-GROUPS');
                vmh.q.all([vmh.translate([key_chart_title_elderlyagegroups,key_chart_serie_name_elderlyagegroups]),vmh.translate(titles)]).then(function(ret) {

                    var names = _.values(ret[1]);
                    var data = [];
                    for(var i=0;i< values.length;i++) {
                        data.push({name: names[i], value: values[i]});
                    }
                    vm.elderlyAgeGroups_id = $echarts.generateInstanceIdentity();
                    vm.elderlyAgeGroups_config = {
                        title: {
                            text: ret[0][key_chart_title_elderlyagegroups],
                            subtext: vm.tenant_name,
                            x: 'center'
                        },
                        tooltip: {
                            trigger: 'item',
                            formatter: "{a} <br/>{b} : {c} ({d}%)"
                        },
                        legend: {
                            orient: 'vertical',
                            left: 'left',
                            data: names
                        },
                        series: [
                            {
                                name: ret[0][key_chart_serie_name_elderlyagegroups],
                                type: 'pie',
                                radius: '55%',
                                center: ['50%', '60%'],
                                data: data,
                                itemStyle: {
                                    emphasis: {
                                        shadowBlur: 10,
                                        shadowOffsetX: 0,
                                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                                    }
                                }
                            }
                        ]
                    };
                    vm.elderlyAgeGroups_loaded = true;
                });

            });

        }

        function roomVacancyRateMonthly(){

            extensionOfDashboardOfTenantNode.roomVacancyRateMonthly(vm.tenantId,moment().subtract(5,'months').format('YYYY-MM-DD'),moment().format('YYYY-MM-DD')).then(function(rows) {
                //data: ['2016-02','2016-03','2016-04','2016-05','2016-06','2016-07'] //legend data
                //data:[0, 0, 0, 0, 0, 13, 10],//serials data
                var names = _.pluck(rows,'period_value');
                var data = _.pluck(rows,'amount');

                var key_chart_title_roomVacancyRateMonthly = vm.moduleTranslatePath('CHART-TITLE-ROOM-VACANCY_RATE-MONTHLY');
                var key_chart_serie_name_roomVacancyRateMonthly = vm.moduleTranslatePath('CHART-SERIE-NAME-ROOM-VACANCY_RATE-MONTHLY');
                var key_chart_serie_data_unit_roomVacancyRateMonthly = vm.moduleTranslatePath('CHART-SERIE-DATA-UNIT-ROOM-VACANCY_RATE-MONTHLY');
                var key_aggregate_keywords_max = 'aggregate_keywords.MAX';
                var key_aggregate_keywords_min = 'aggregate_keywords.MIN';
                var key_aggregate_keywords_average = 'aggregate_keywords.AVERAGE';

                vmh.translate([
                    key_chart_title_roomVacancyRateMonthly,
                    key_chart_serie_name_roomVacancyRateMonthly,
                    key_chart_serie_data_unit_roomVacancyRateMonthly,
                    key_aggregate_keywords_max,
                    key_aggregate_keywords_min,
                    key_aggregate_keywords_average
                ]).then(function(ret){
                    vm.roomVacancyRateMonthly_id = $echarts.generateInstanceIdentity();
                    vm.roomVacancyRateMonthly_config = {
                        title: {
                            text: ret[key_chart_title_roomVacancyRateMonthly],
                            subtext: vm.tenant_name
                        },
                        tooltip: {
                            trigger: 'axis'
                        },
                        xAxis:  {
                            type: 'category',
                            boundaryGap: false,
                            data: names
                        },
                        yAxis: {
                            type: 'value',
                            axisLabel: {
                                formatter: '{value} '+ret[key_chart_serie_data_unit_roomVacancyRateMonthly]
                            }
                        },
                        series: [
                            {
                                name:ret[key_chart_serie_name_roomVacancyRateMonthly],
                                type:'line',
                                data: data,
                                markPoint: {
                                    data: [
                                        {type: 'max', name: ret[key_aggregate_keywords_max]},
                                        {type: 'min', name: ret[key_aggregate_keywords_min]}
                                    ]
                                },
                                markLine: {
                                    data: [
                                        {type: 'average', name: ret[key_aggregate_keywords_average]}
                                    ]
                                }
                            }
                        ]
                    };
                    vm.roomVacancyRateMonthly_loaded = true;
                });
            });
        }

        function roomCatagoryOfManTime(){
            extensionOfDashboardOfTenantNode.roomCatagoryOfManTime(vm.tenantId).then(function(rows){
                var titles = _.map(rows,function(o){return vm.moduleTranslatePath(o.title);});
                var values = _.pluck(rows,'value');

                var key_chart_title_roomCatagoryOfManTime = vm.moduleTranslatePath('CHART-TITLE-ROOM-CATAGORY-OF-MANTIME');
                var key_chart_serie_name_roomCatagoryOfManTime = vm.moduleTranslatePath('CHART-SERIE-NAME-ROOM-CATAGORY-OF-MANTIME');


                vmh.q.all([vmh.translate([
                    key_chart_title_roomCatagoryOfManTime,
                    key_chart_serie_name_roomCatagoryOfManTime
                ]),vmh.translate(titles)]).then(function(ret){

                    var names = _.values(ret[1]);
                    var data = [];
                    for(var i=0;i< values.length;i++) {
                        data.push({name: names[i], value: values[i]});
                    }

                    vm.roomCatagoryOfManTime_id = $echarts.generateInstanceIdentity();
                    vm.roomCatagoryOfManTime_config = {
                        title: {
                            text: ret[0][key_chart_title_roomCatagoryOfManTime],
                            subtext: vm.tenant_name
                        },
                        tooltip: {
                            trigger: 'item',
                            formatter: "{a} <br/>{b}: {c} ({d}%)"
                        },
                        legend: {
                            orient: 'vertical',
                            x: 'left',
                            data:names
                        },
                        series: [
                            {
                                name:ret[0][key_chart_serie_name_roomCatagoryOfManTime],
                                type:'pie',
                                radius: ['50%', '70%'],
                                avoidLabelOverlap: false,
                                label: {
                                    normal: {
                                        show: false,
                                        position: 'center'
                                    },
                                    emphasis: {
                                        show: true,
                                        textStyle: {
                                            fontSize: '30',
                                            fontWeight: 'bold'
                                        }
                                    }
                                },
                                labelLine: {
                                    normal: {
                                        show: false
                                    }
                                },
                                data:data
                            }
                        ]
                    };
                    vm.roomCatagoryOfManTime_loaded = true;
                });
            });
        }

        function roomCatagoryOfManTimeMonthly() {
            extensionOfDashboardOfTenantNode.roomCatagoryOfManTimeMonthly(vm.tenantId, moment().subtract(5, 'months').format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')).then(function (result) {
                var xAxisData = result.xAxisData;
                var titles = _.map(result.seriesData,function(o){return vm.moduleTranslatePath(o.name);});
                var key_chart_title_roomCatagoryOfManTimeMonthly = vm.moduleTranslatePath('CHART-TITLE-ROOM-CATAGORY-OF-MANTIME-Monthly');

                vmh.q.all([vmh.translate([
                    key_chart_title_roomCatagoryOfManTimeMonthly
                ]),vmh.translate(titles)]).then(function(ret){

                    var names = _.values(ret[1]);
                    var seriesData = _.map(result.seriesData,function(o,i){return _.extend(o,{name:names[i], type:'bar'})});

                    vm.roomCatagoryOfManTimeMonthly_id = $echarts.generateInstanceIdentity();
                    vm.roomCatagoryOfManTimeMonthly_config = {
                        title: {
                            text: ret[0][key_chart_title_roomCatagoryOfManTimeMonthly],
                            subtext: vm.tenant_name
                        },
                        tooltip : {
                            trigger: 'axis',
                            axisPointer : {            // 坐标轴指示器，坐标轴触发有效
                                type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
                            }
                        },
                        legend: {
                            x: 'center',
                            y:'bottom',
                            data:names
                        },
                        grid: {
                            left: '3%',
                            right: '4%',
                            bottom: '10%',
                            containLabel: true
                        },
                        xAxis : [
                            {
                                type : 'category',
                                data : xAxisData
                            }
                        ],
                        yAxis : [
                            {
                                type : 'value'
                            }
                        ],
                        series : seriesData
                    };
                    vm.roomCatagoryOfManTimeMonthly_loaded = true;
                });


            });
        }
    }

})();