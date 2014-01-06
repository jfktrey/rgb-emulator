// Main file for RGB-specific code

$(window).load(function () {
	'use strict';
	
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//JQUERY FUNCTIONS////////////////////////////////////////////////////////////////////////////////////////////////////
	
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
	
	// Sets a canvas' interpolation mode
	(function ($) {
		$.fn.cssCanvasInterpolation = function (useSmoothing) {
			$(this).each( function () {
				var vendorProperty	= 'image-rendering',
					vendorValue		= '';
				
				if ($.browser.msie) {
					vendorProperty	= '-ms-interpolation-mode'; }
				
				if (!useSmoothing) {
					vendorValue		= 'optimizeSpeed';
					
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

	// Generates headings for each letter in a UL
	// Currently unused
	(function ($) {
		$.fn.generateHeading = function () {
			var currentLetter = '',
				newLetter = '';

			$(this).children().each( function (index) {
				newLetter = $(this).text().slice(0, 1);
				if (currentLetter !== newLetter) {
					currentLetter = newLetter;
					$(this).before('<li class="letterSectionHeader">' + newLetter + '</li>');
				}
			});
			
			return $(this);
		}
	})(jQuery);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//OTHER FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////////////////////
	
	// The guts of how the touch-based controls work
	function attachTouchEvents (jQueryClickmask, button) {
		$(config.controls.bothSideSelector).documents().preventUIActions();

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

	// Given a reference to an SVG embedded via an <object> and a selector for a clickmask within that svg, return a reference to the clickmask.
	function buttonMask (SVGSelector, MaskSelector) {
		return $(MaskSelector, $(SVGSelector).documents()[0])[0];
	}

	// If smoothing is true, then the canvas will use the browser's default interpolation. If false, it uses faster nearest-neighbor interpolation.
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

	// This was initially in the XAudioServer.js initialization
	// Moved to this file to allow for unmuting the game's audio context by hooking into the first touch event.
	function initializeAudioContext () {
		var toReturn = null;

		try {
			toReturn = new webkitAudioContext();							//Create a system audio context.
		}
		catch (error) {
			try {
				toReturn = new AudioContext();								//Create a system audio context.
			}
			catch (error) {}
		}

		return toReturn;
	}

	// The first call to a noteOn in some mobile browsers (such as iOS Safari) has to occur inside a touch event for an audio context to be unmuted
	// Therefore, we should capture the first touch event and play silence to "unlock" our audio context
	function unlockAudio () {
		try {
			var buffer = globalAudioContext.createBuffer(1, 1, 22050);
			var source = globalAudioContext.createBufferSource();
			source.buffer = buffer;
			source.connect(globalAudioContext.destination);
			source.noteOn(0);
		} catch (error) {}
	}

	// Display a button to connect to dropbox if we aren't authenticated already
	// Otherwise, load all the games, drop them in the DOM, and display the list
	function dropboxStateHandler (isAuthenticated) {
		if (!isAuthenticated) {
			mode.choose(config.modals.selectors.connect);
		} else {
			mode.in(config.modals.menu.buttonSelector, true);
			dropbox.list('/ROMS/', function(list, error){
				list = list.sort();
				if (error) return console.error(error);
				for (var rom in list) {
					$(config.dropbox.romListSelector)
						.append(
							$('<li class="romFile">' + list[rom].split('.gb')[0] + '</li>').data('rom-filename', list[rom]));
				}
				$('.romFile').on('tap', function (event){
					unlockAudio();
					$(document).preventUIActions();
					loadRom($(this).data('rom-filename'));
				})
				//$(config.dropbox.romListSelector).generateHeading();
				mode.choose(config.modals.selectors.loadGame)
			});
		}
	}

	// The function that's called when a rom is selected
	// Moves to the loading screen and sets up a callback for when the game loads to enter the game screen
	function loadRom (romName) {
		mode.choose(config.modals.selectors.spinner)
		dropbox.load('/ROMS/'+romName, function(romBuffer){
			mode.out(config.modals.container, true);
			start($(config.screen.selector)[0], arrayBufferToString(romBuffer));
		});
	}

	// Takes the arraybuffer returned by dropbox and converts it to a binary string for loading by the emulator
	// Had help with this one, but can't quite remember where from.
	function arrayBufferToString(arrayBuffer) {
		var binaryString = '',
		bytes = new Uint8Array(arrayBuffer),
		length = bytes.length;
		for (var i = 0; i < length; i++) {
			binaryString += String.fromCharCode(bytes[i]);
		}
		return binaryString;
	}

	// Set up the click event for the connect button
	function attachDropboxAuth (selector) {
		$(selector).on('tap', function () {
			window.dropbox.client.authenticate(function(error, client) {
				if (error) return dropboxAuthErrorHandler(error);
			});
		});
	}

	// Do more advanced error handling in the future...
	function dropboxAuthErrorHandler (error) {
		console.error(error);
	}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//SETUP///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	// Initialize animation
	window.mode = new rgbMode(config.modals);

	// Set up our deflate worker for localStorage (see localStorage.js)
	initDeflate();
	
	// Set up drawing context width, height, and interpolation
	// This works for Safari-based browsers (iOS and OS X) and Firefox, but NOT Chrome or IE (as of 1/3/2014). Awesome, fragmentation!
	setupDrawingContext(
		$(config.screen.selector),
		{'width': config.screen.nativeWidth, 'height': config.screen.nativeHeight},
		config.screen.smoothing
	);

	// Set up the sizer that picks up where CSS doesn't reach
	// Notably, keeping our canvas a certain aspect ratio
	// Also, vertically centering the controls in the whitespace below the screen in portrait
	// Possibly a way to do this with CSS, but this works well for now
	window.sizer = new rgbSizer();

	// Set up audio.
	// Have to have a global audio context because we need to unlock the audio in the tap event for loading a game.
	window.globalAudioContext = initializeAudioContext();
	$.getScript("./scripts/gameboy-online/dependencies/XAudioServer.js")

	// Initialize dropbox and set everything up via the callback to dropboxStateHandler
	window.dropbox = new rgbDropbox(dropboxStateHandler, dropboxAuthErrorHandler);
	attachDropboxAuth(config.dropbox.connectButtonEventSelector);

	
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//BINDINGS////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// Bind all our controller functions
	[	buttonMask(config.controls.up[0], config.controls.up[1]),
		buttonMask(config.controls.down[0], config.controls.down[1]),
		buttonMask(config.controls.left[0], config.controls.left[1]),
		buttonMask(config.controls.right[0], config.controls.right[1]),
		buttonMask(config.controls.a[0], config.controls.a[1]),
		buttonMask(config.controls.b[0], config.controls.b[1]),
		buttonMask(config.controls.select[0], config.controls.select[1]),
		buttonMask(config.controls.start[0], config.controls.start[1])
	].map(function (value, index) {
		attachTouchEvents($(value)); });

	
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//CLOSING CONFIGURATION///////////////////////////////////////////////////////////////////////////////////////////////		
	
	// Check for debug hashes and load if enabled
	if (location.href.indexOf('#debug') !== -1) {
		config.debug.enabled = true;}
	if (location.href.indexOf('#rps') !== -1) {
		config.debug.rpsCount = true;}
	if (config.debug.enabled) {
		$.getScript('./scripts/rgb/debug.js');}
	
	// Gives the user a webapp on the home screen instead of a bookmark.
	// Advantages and disadvantages to this.
	if (config.behavior.webAppCapable) {
		$('head').append('<meta name="apple-mobile-web-app-capable" content="yes">');}

	//
	if (config.behavior.newWindowLinks) {
		$("a").attr("target","_blank");}
	
	// Pause our game if the window loses focus
	// These also fire when an embedded document (such as an SVG embedded via <object>) is clicked
	// Get around this by setting pointer-events to none if it's purely asthetic, or e.preventDefault() in a 'tap' and/or 'click' event
	if (config.behavior.pauseOnBlur) {
		$(window).blur(function(){
			pause(true)
		});
		$(window).focus(function(){
			run(true)
		});
	}

});