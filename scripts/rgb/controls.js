// Code for the touch-based controls for mobile devices

$(window).load(function () {
	'use strict';

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


	function attachTouchEvents (jQueryClickmask, button) {
		jQueryClickmask
			.on('touchstart', function (event) {
				event.preventDefault();
				GameBoyKeyUp(this.ownerDocument.currentButton);
				this.ownerDocument.currentButton		= $(this).attr('id');
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
		
		// For desktop-based testing.
		// As a nice side effect, this causes window.onblur not to fire when one of the buttons is clicked in the browser
		jQueryClickmask
			.on('mousedown', function(event) {
				event.preventDefault();
				this.ownerDocument.currentButton = $(this).attr('id');
				GameBoyKeyDown(this.ownerDocument.currentButton);
			}).on('mouseup', function () {
				GameBoyKeyUp(this.ownerDocument.currentButton);
				this.ownerDocument.currentButton = null;
			});
	}