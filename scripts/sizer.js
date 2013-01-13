(function () {
	'use strict';
	window.sizer = {
	
		setup: function (config) {
			
			$(window).resize(function () {
				var width, height, pixelRatio = window.devicePixelRatio;
				
				if (config.scalingMethod === 'fit') {	//NOTE: include scaling methods
					if (window.innerWidth / window.innerHeight > config.nativeWidth / config.nativeHeight) {
						height	= window.innerHeight;
						width	= Math.floor(height * (config.nativeWidth / config.nativeHeight));
					} else {
						width	= window.innerWidth;
						height	= Math.floor(width / (config.nativeWidth / config.nativeHeight));
					}
				} else {
					height = width = 'auto';
				}
				
				config.jQueryCanvas.parent().andSelf().css('width', width).css('height', height);	//Sizes both the parent and self, so that screen overlay will be properly positioned.
				
				// Whitespace for portrait mode
				if (window.innerWidth / window.innerHeight < config.nativeWidth / config.nativeHeight) {
					var whitespace = window.innerHeight -
									parseInt(config.jQueryCanvas.height()) -
									parseInt(config.jQueryControlsBoth.height());
					whitespace = (whitespace > (config.minimumBottomPad * 2)) ? whitespace : (config.minimumBottomPad * 2);
					config.jQueryControlsBoth.css('margin-top', -1 * whitespace / 2);
				} else {
					config.jQueryControlsBoth.css('margin-top', 0);
				}
			});
			
			
			$(window).trigger('resize');	//Make an initial call to the sizer.
		}
	};
})();