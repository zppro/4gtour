/**=========================================================
 * Module: classy-loader.js
 * Enable use of classyloader directly from data attributes
 *
 * 配置参数options
 width：圆形进度条的宽度，单位像素，默认值200。
 height：圆形进度条的高度，单位像素，默认值200。
 animate：圆形进度条是否动画，默认值为true。
 percentage：圆形进度条的百分比值，0-100之间，默认值为100。
 speed：一次动画循环的时间，单位毫秒，默认值为1。
 showRemaining：是否显示剩余的百分比，默认值为true。
 start：开始的角度，默认值为left，可选值有：left，right，top和bottom。
 fontFamily：百分比数值的字体，默认值为Helvetica。
 showText：是否显示百分比数值文本，默认值为true。
 fontSize：百分比数值的字体尺寸，单位像素，默认值50px。
 roundedLine：是否使用圆角，单位像素，默认值false。
 diameter：圆形进度条的直径，单位像素，默认值80。
 fontColor：百分比文本的颜色，可以是任何CSS颜色，hex，rgb，rgba，hsl，hsla。默认值为rgba(25, 25, 25, 0.6)。
 lineColor：圆形进度条的线条颜色，默认值为rgba(55, 55, 55, 1)。
 remainingLineColor：剩余百分比的线条颜色(如果showRemaining为true)。默认值为rgba(55, 55, 55, 0.4)。
 lineWidth：圆形进度条的线条宽度，默认值为5。
 方法

 show()：初始化显示圆形进度条，但是不会动画。
 draw()：使进度条动画到指定的进度。
 setPercent()：设置圆形进度条的百分比值，你可以在它后面使用draw()方法使进度条动画起来。
 getPercent()：返回圆形进度条的百分比值。
 =========================================================*/

(function() {
    'use strict';

    angular
        .module('app.charts')
        .directive('classyloader', classyloader);

    classyloader.$inject = ['$timeout', 'Utils', '$window'];
    function classyloader ($timeout, Utils, $window) {
        var directive = {
            link: link,
            restrict: 'A'
        };
        return directive;

        function link(scope, element) {
          var $scroller       = $($window),
              inViewFlagClass = 'js-is-in-view'; // a classname to detect when a chart has been triggered after scroll

          // run after interpolation  
          $timeout(function(){
      
            var $element = $(element),
                options  = $element.data();
            
            // At lease we need a data-percentage attribute
            if(options) {
              if( options.triggerInView ) {

                $scroller.scroll(function() {
                  checkLoaderInVIew($element, options);
                });
                // if the element starts already in view
                checkLoaderInVIew($element, options);
              }
              else
                startLoader($element, options);
            }

          }, 0);

          function checkLoaderInVIew(element, options) {
            var offset = -20;
            if( ! element.hasClass(inViewFlagClass) &&
                Utils.isInView(element, {topoffset: offset}) ) {
              startLoader(element, options);
            }
          }
          function startLoader(element, options) {
            element.ClassyLoader(options).addClass(inViewFlagClass);
          }
        }
    }

})();
