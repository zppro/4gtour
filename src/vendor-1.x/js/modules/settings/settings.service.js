/**=========================================================
 * Module: settings.service.js
 * 读写设置
 =========================================================*/

(function() {
    'use strict';

    angular
        .module('app.settings')
        .service('SettingsManager', SettingsManager)
    ;

    SettingsManager.$inject = ['$rootScope','SETTING_KEYS'];
    function SettingsManager($rootScope,SETTING_KEYS) {
        var self = this;
        this.instances = {};
        this.currentInstance;
        return {
            getInstance: function (id) {
                if(!id) {
                    return this.currentInstance;
                }
                if (!self.instances[id]) {
                    self.instances[id] = new SettingsInstance($rootScope);
                }
                return self.instances[id];
            },
            setCurrentInstance : function (settingsInstance) {
                this.currentInstance = settingsInstance;
            },
            buildInstance: function (id, options) {
                if (!self.instances[id]) {
                    self.instances[id] = new SettingsInstance($rootScope, options);
                }
            },
            getSubsystemInstance: function (sref) {
                var id;
                if (SETTING_KEYS.SREF_MERCHANT_WEBSTORE == sref) {
                    id = SETTING_KEYS.STORAGE_ID_MERCHANT_WEBSTORE;
                }
                else if (SETTING_KEYS.SREF_PENSION_AGENCY == sref) {
                    id = SETTING_KEYS.STORAGE_ID_PENSION_AGENCY;
                }
                else if (SETTING_KEYS.SREF_HEALTH_CENTER == sref) {
                    id = SETTING_KEYS.STORAGE_ID_HEALTH_CENTER;
                }
                else if (SETTING_KEYS.SREF_ORGANIZATION_TRAVEL == sref) {
                    id = SETTING_KEYS.STORAGE_ID_ORGANIZATION_TRAVEL;
                }
                else if (SETTING_KEYS.SREF_MANAGE_CENTER == sref) {
                    id = SETTING_KEYS.STORAGE_ID_MANAGE_CENTER;
                }

                if (id) {
                    this.buildInstance(id, {storage: $rootScope.app.subsystem[id]});
                }
                return self.instances[id];
            }
        }
    }

    function SettingsInstance(options) {
        this.storage = options.storage||{};
        this.write = write;
        this.read = read;
        this.remove = remove;
        this.clear = clear;

        function write(key,val) {
            this.storage[key] = val;
        }

        function read(key,defaultVal) {
            return this.storage[key] || defaultVal;
        }

        function remove(key) {
            this.storage[key] = null;
            delete this.storage[key];
        }

        function clear() {
            this.storage = {};
        }
    }
})();
