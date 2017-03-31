/*!
 * 
 * Angle - Bootstrap Admin App + AngularJS
 * 
 * Version: 3.0.0
 * Author: @themicon_co
 * Website: http://themicon.co
 * License: https://wrapbootstrap.com/help/licenses
 * 
 */

// APP START
// ----------------------------------- 

(function() {
    'use strict';

    angular
        .module('4gtour', [
            'app.core',
            'app.settings',
            'app.routes',
            'app.socket',
            'app.sidebar',
            // 'app.navsearch',
            'app.preloader',
            'app.loadingbar',
            'app.translate',
            'app.pages',
            'app.notify',
            'app.utils',
            'app.interceptor',
            'app.auth',
            'app.model',
            // 'app.charts',
            'app.grid',
            'app.tree',
            'app.dropdown'
        ]);
})();

