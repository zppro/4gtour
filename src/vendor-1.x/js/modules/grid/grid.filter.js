/**
 * Created by zppro on 16-2-26.
 */

(function() {
    'use strict';

    angular
        .module('app.grid')
        .filter('paging', paging)
        .filter('totals',totals)
        .filter('hide',hide)
        .filter('width',width)
        .filter('orderClass',orderClass)
        .filter('revertNumber',revertNumber)
        .filter('calcAge',calcAge)
        .filter('formatter',formatter)
        .filter('populateFilter',populateFilter)
        .filter('boolFilter',boolFilter)
        .filter('diFilter',diFilter)
        .filter('orFilter',orFilter)
    ;

    paging.$inject = ['GridUtils'];
    totals.$inject = ['GridUtils'];
    hide.$inject = ['GridUtils'];
    width.$inject = ['GridUtils'];
    orderClass.$inject = ['GridUtils'];
    revertNumber.$inject = ['GridUtils'];
    calcAge.$inject = ['GridUtils'];
    formatter.$inject = ['GridUtils'];
    populateFilter.$inject = ['GridUtils'];
    boolFilter.$inject = ['GridUtils'];
    diFilter.$inject = ['GridUtils'];
    orFilter.$inject = ['GridUtils'];

    function paging(GridUtils) {
        return GridUtils.paging;
    }

    function totals(GridUtils){
        return GridUtils.totals;
    }

    function hide(GridUtils) {
        return GridUtils.hide;
    }

    function width(GridUtils) {
        return GridUtils.width;
    }

    function orderClass(GridUtils) {
        return GridUtils.toggleOrderClass;
    }

    function revertNumber(GridUtils){
        return GridUtils.revertNumber;
    }

    function calcAge(GridUtils){
        return GridUtils.calcAge;
    }

    function formatter(GridUtils){
        return GridUtils.formatter;
    }

    function populateFilter(GridUtils) {
        return GridUtils.populateFilter;
    }

    function boolFilter(GridUtils) {
        return GridUtils.boolFilter;
    }

    function diFilter(GridUtils){
        return GridUtils.diFilter;
    }

    function orFilter(GridUtils) {
        return GridUtils.orFilter;
    }

})();
