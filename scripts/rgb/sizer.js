// Sizing functions for the screen and control pad
// Relies on the global "config" variable

function rgbSizer () {
	(function (selfRef) {
		$(window).resize(function () {
			selfRef.setGameScreenDimensions();
			selfRef.controlPadPositioning();
			selfRef.urlBarHiding();
		});
	})(this);
	
	$(window).trigger('resize');			//Make an initial call to the sizer.
}


// Sizes the game screen
// Right now, it just makes its width and height equal to the larger of the window's width and height.
// If anything besides 'fit' is used for scaling, the game screen width and height will be set to 'auto'.
rgbSizer.prototype.setGameScreenDimensions = function () {
	var width, height, pixelRatio = window.devicePixelRatio;
	
	if (config.screen.scaling === 'fit') {	// Can include other scaling methods in the future if required.
		if (window.innerWidth / window.innerHeight > config.screen.nativeWidth / config.screen.nativeHeight) {
			height	= window.innerHeight;
			width	= Math.floor(height * (config.screen.nativeWidth / config.screen.nativeHeight));
		} else {
			width	= window.innerWidth;
			height	= Math.floor(width / (config.screen.nativeWidth / config.screen.nativeHeight));
		}
	} else {
		height = width = 'auto';
	}
	
	$(config.screen.selector).css('width', width).css('height', height);
}


// When in portrait mode, centers the control pad in the space between the bottom of the game screen and the bottom of the window.
// If the size of the control pad is larger than the size of this space, then the config.controls.minimumBottomPad will be used to add a small amount of space between the control pad and the bottom of the window.
rgbSizer.prototype.controlPadPositioning = function () {
	if (window.innerWidth / window.innerHeight < config.screen.nativeWidth / config.screen.nativeHeight) {
		var whitespace = window.innerHeight -
						parseInt($(config.screen.selector).height()) -
						parseInt($(config.controls.bothSideSelector).height());
		whitespace = (whitespace > (config.controls.minimumBottomPad * 2)) ? whitespace : (config.controls.minimumBottomPad * 2);
		$(config.controls.bothSideSelector).css('margin-top', -1 * whitespace / 2);
	} else {
		$(config.controls.bothSideSelector).css('margin-top', 0);
	}
}


// Attempts to hide the URL bar on mobile browsers through just a scrollTo(0,0) or
// an expander which makes sure that the page's content is at least equal to the screen width and then a scrollTo(0,0)
rgbSizer.prototype.urlBarHiding = function () {
	if (config.screen.useExpander) {
		if ($(config.screen.expanderIdSelector).length === 0) {
			$('body').append('<div id="' + config.screen.expanderIdSelector.substring(1) + '"></div>');
		}
		$(config.screen.expanderIdSelector).height(Math.max(screen.height, screen.width)).width(0);
	}

	if (config.screen.tryScrollToZero) {
		setTimeout(function () {
			window.scrollTo(0, 0);}
		, 0);
	}
}