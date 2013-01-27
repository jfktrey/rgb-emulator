$(window).load(function () {
	'use strict';
	
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//CONFIGURATION///////////////////////////////////////////////////////////////////////////////////////////////////////	
	var config = {
		debug:	{
			enabled:		false,	//Overriden to be true if #debug exists in the URL
			suggestCache:	false,
			remote: 		true,
			firebug:		true},
		
		screen: {
			selector:			'#screen',
			scaling:			'fit',
			smoothing:			false,		//settings[13]
			gbColored:			true,		//settings[4]
			nativeWidth:		160,		// If this changes, you have to duplicate it in the stylesheet.
			nativeHeight:		144},
		
		audio:	{
			enabled: 			true,
			volume:				1,		//settings[3]
			minimumInterval:	15,		//settings[7]
			maximumInterval:	50},	//settings[8]
		
		controls: {
			enabled:			true,
			leftSideSelector:	'#arrows',
			rightSideSelector:	'#buttons',
			bothSideSelector:	'object.svg',
			minimumBottomPad:	2,
			clickMaskSelector:	'.clickmask',
			buttonMask:			function (SVGSelector, MaskSelector) {
									return $(MaskSelector, $(SVGSelector).documents()[0])[0];
								},
			up:		['#arrows', '#up'],
			down:	['#arrows', '#down'],
			left:	['#arrows', '#left'],
			right:	['#arrows', '#right'],
			a:		['#buttons', '#a'],
			b:		['#buttons', '#b'],
			select:	['#buttons', '#select'],
			start:	['#buttons', '#start']},
		
		core:	{
			loopInterval:				4,		//settings[6]
			bootROMFirst:				true,	//settings[1]
			useGBBootROM:				false,	//settings[11]
			gbModePriority:				false,	//settings[2]
			compatibilityFix:			false,	//settings[9]
			//disallowTypedArrays:		false,	//settings[5]		Just use a polyfill if I ever decide to use this
			overrideMBCRAMLock:			false,	//settings[10]
			sramAutosave:				true},	//Mine. He-yo!
		
		webAppCapable: 		true};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	// Returns the contentDocuments for every node
	(function ($) {
		$.fn.documents = function () {
			var toReturn = [];
			
			this.each( function () {
				toReturn.push( this.contentDocument );
			});
			
			return $(toReturn);
		}
	})(jQuery);
	
	// Prevents touch scrolling and disables selection
	(function ($) {
		$.fn.preventUIActions = function () {
			$(this).each( function () {
				$(this)
					.on('touchstart',	function(event) {
						event.preventDefault(); })
					.on('touchmove',	function(event) {
						event.preventDefault(); })
					.css({
						'-webkit-touch-callout':	'none',
						'-webkit-user-select':		'none',
						'-moz-user-select':			'none',
						'-ms-user-select': 			'none',
						'user-select': 				'none'})
					.attr('unselectable', 'on');
			});
			
			return $(this);
		}
	})(jQuery);
	
	(function ($) {
		$.fn.cssCanvasInterpolation = function (toggle) {
			$(this).each( function () {
				var vendorProperty	= 'image-rendering',
					vendorValue		= '';
				
				if ($.browser.msie) {
					vendorProperty	= '-ms-interpolation-mode'; }
				
				if (!toggle) {
					var vendorValue		= 'optimizeSpeed';
					
					if ($.browser.webkit) {
						vendorValue = '-webkit-optimize-contrast';}
					else if ($.browser.mozilla) {
						vendorValue = '-moz-crisp-edges';}
					else if ($.browser.msie) {
						vendorValue		= 'nearest-neighbor';}
					else if ($.browser.opera) {
						vendorValue = '-o-crisp-edges';}
				}
				
				$(this).css(vendorProperty, vendorValue);
			});
			return $(this);
		}
	})(jQuery);
	
	// If toggle is true, then the canvas will use the browser's default interpolation. If false, it uses faster bicubic interpolation.
	// Because many browsers don't support image-rendering css properties right now (end of 2012), we have to hook directly into the canvas context.
	
	function setupDrawingContext (screen, dimensions, smoothing) {
		var ctx = screen[0].getContext('2d');
		
		screen.attr({
			'width':	dimensions.width,
			'height':	dimensions.height });
		
		screen.cssCanvasInterpolation(smoothing);
		ctx.imageSmoothingEnabled = smoothing;
		ctx.mozImageSmoothingEnabled = smoothing;
		ctx.webkitImageSmoothingEnabled = smoothing;
		
		return ctx;
	}
	
	function attachTouchEvents ( jQueryClickmask, button ) {
		jQueryClickmask
			.on('touchstart', function (event) {
				event.preventDefault();
				GameBoyKeyUp(this.ownerDocument.currentButton);
				this.ownerDocument.currentButton		= $(this).attr('id');
				this.ownerDocument.buttonChangeTimeout	= null;
				GameBoyKeyDown(this.ownerDocument.currentButton);
			}).on('touchmove', function (event) {		// The way this works right now, you can't press A and B at the same time (or any two buttons on the same SVG document). Not sure if problem.
				event.preventDefault();
				
				var svgDocument		= this.ownerDocument;
				var mostRecentTouch	= event.originalEvent.touches[event.originalEvent.touches.length - 1];
				var overButton		= $(svgDocument.elementFromPoint(mostRecentTouch.clientX, mostRecentTouch.clientY)).attr('id');
				
				if ((svgDocument.currentButton !== overButton) && (overButton !== 'glide')) {
					GameBoyKeyUp(svgDocument.currentButton);
					
					svgDocument.currentButton = overButton;
					GameBoyKeyDown(svgDocument.currentButton);
				}
			}).on('touchend', function () {
				GameBoyKeyUp(this.ownerDocument.currentButton);
				this.ownerDocument.currentButton	= null;
			});
		
		// For browser-based testing only.
		jQueryClickmask
			.on('mousedown', function(event) {
				event.preventDefault();
				GameBoyKeyDown(id);
			}).on('mouseup', function () {
				GameBoyKeyUp(id);
			});
	}
	
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//ACTIONS/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	if (location.href.indexOf('#debug') !== -1) {
		config.debug.enabled = true;}
	if (config.debug.enabled) {
		window.debug = config.debug;
		$.getScript('./scripts/debug.js');}
	
	if (config.webAppCapable) {
		$('head').append('<meta name="apple-mobile-web-app-capable" content="yes">');}
	
	[
		config.controls.buttonMask(config.controls.up[0], config.controls.up[1]),
		config.controls.buttonMask(config.controls.down[0], config.controls.down[1]),
		config.controls.buttonMask(config.controls.left[0], config.controls.left[1]),
		config.controls.buttonMask(config.controls.right[0], config.controls.right[1]),
		config.controls.buttonMask(config.controls.a[0], config.controls.a[1]),
		config.controls.buttonMask(config.controls.b[0], config.controls.b[1]),
		config.controls.buttonMask(config.controls.select[0], config.controls.select[1]),
		config.controls.buttonMask(config.controls.start[0], config.controls.start[1])
	]
		.map(function (value, index) {
			attachTouchEvents($(value)); });
	
	
	setupDrawingContext(
		$(config.screen.selector),
		config.screen.nativeWidth,
		config.screen.nativeHeight,
		config.screen.smoothing
	);
	
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//"BINDINGS BINDINGS BINDINGS BINDINGS" - Steve Ballmer///////////////////////////////////////////////////////////////
	
	sizer.setup({
		scalingMethod:			config.screen.scaling,
		smoothingEnabled:		config.screen.smoothing,
		nativeWidth:			config.screen.nativeWidth,
		nativeHeight:			config.screen.nativeHeight,
		minimumBottomPad:		config.controls.minimumBottomPad,
		jQueryCanvas:			$(config.screen.selector),
		jQueryControlsLeft:		$(config.controls.leftSideSelector),
		jQueryControlsRight:	$(config.controls.rightSideSelector),
		jQueryControlsBoth:		$(config.controls.bothSideSelector)});
	
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//CLOSING ACTIONS/////////////////////////////////////////////////////////////////////////////////////////////////////		
	
	$(document).preventUIActions();
	$(config.controls.bothSideSelector).documents().preventUIActions();
	
	$.getScript('./demo.js');
	
});