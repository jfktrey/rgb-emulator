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
						vendorValue	= 'nearest-neighbor';}
					else if ($.browser.opera) {
						vendorValue = '-o-crisp-edges';}
				}
				
				$(this).css(vendorProperty, vendorValue);
			});
			return $(this);
		}
	})(jQuery);

	// Prevents or re-enables touch scrolling and selection
	(function ($) {
		$.fn.configureUIActions = function (enabled) {
			if (enabled) {
				$(this).each( function () {
					$(this)
						.off('touchstart')
						.off('touchmove')
						.css({
							'-webkit-touch-callout':	'default',
							'-webkit-user-select':		'auto',
							'-moz-user-select':			'text',
							'-ms-user-select': 			'text',
							'user-select': 				'text'})
						.attr('unselectable', 'off');
				});
			} else {
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
			}
			
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

	// Makes dealing with toggleIt easier
	(function ($) {
		$.fn.toggleSwitch = function (newValue) {
			var selected = []
			$(this).find(".toggleIt-container").each( function (index) {
				if (newValue !== undefined) {
					if (!$(this).hasClass("selected") != !newValue) $(this).click();
				} else {
					selected.push($(this).hasClass("selected"));
				}
			});
			
			if (newValue !== undefined) {
				return $(this);
			} else {
				return selected;
			}
		}
	})(jQuery);

	// Loading same-domain scripts using $.getScript() can cause errors to not show.
	// Patch getScript so that it uses the script element injection method, which it normally uses for cross-domain requests.
	// This way, errors show up. (see on stackoverflow: http://stackoverflow.com/a/691661/433380 )
	jQuery.extend({
		getScript: function(url, callback) {
			var head = document.getElementsByTagName("head")[0];
			var script = document.createElement("script");
			script.src = url;
			var done = false;
			// Attach handlers for all browsers
			script.onload = script.onreadystatechange = function () {
				if (!done && (!this.readyState || this.readyState == "loaded" || this.readyState == "complete")) {
					done = true;
					if (callback) callback();
						script.onload = script.onreadystatechange = null; 		// Handle memory leak in IE
				}
			};
	
			head.appendChild(script);
			return undefined; 			// We handle everything using the script element injection
		},
	});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//GLOBAL UTILITY FUNCTIONS////////////////////////////////////////////////////////////////////////////////////////////

	window.getFunctionBody = function (functionToParse) {
		var functionText = functionToParse.toString();
		return functionText.slice(functionText.indexOf("{") + 1, functionText.lastIndexOf("}"));
	}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//OTHER FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////////////////////
	
	// The guts of how the touch-based controls work
	function attachTouchEvents (jQueryClickmask) {
		$(config.controls.bothSideSelector).documents().configureUIActions(false);

		jQueryClickmask
			.on('touchstart', function (event) {
				event.preventDefault();
				GameBoyKeyUp(this.ownerDocument.currentButton);
				this.ownerDocument.currentButton = $(this).data('keycode');
				GameBoyKeyDown(this.ownerDocument.currentButton);
			}).on('touchmove', function (event) {		// The way this works right now, you can't press A and B at the same time (or any two buttons on the same SVG document). Not sure if problem.
				event.preventDefault();
				
				var svgDocument		= this.ownerDocument;
				var mostRecentTouch	= event.originalEvent.touches[event.originalEvent.touches.length - 1];
				var overButton		= $(svgDocument.elementFromPoint(mostRecentTouch.clientX, mostRecentTouch.clientY)).data('keycode');
				
				if ((svgDocument.currentButton !== overButton) && (overButton !== config.controls.glideKeycode)) {
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
				this.ownerDocument.currentButton = $(this).data('keycode');
				GameBoyKeyDown(this.ownerDocument.currentButton);
			}).on('mouseup', function () {
				GameBoyKeyUp(this.ownerDocument.currentButton);
				this.ownerDocument.currentButton = null;
			});
	}

	// Given a reference to an SVG embedded via an <object> and a selector for a clickmask within that svg, return a reference to the clickmask.
	function buttonMask (selectorArray) {
		return $(selectorArray[1], $(selectorArray[0]).documents()[0])[0];
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
			toReturn = new AudioContext();								//Create a system audio context.
		} catch (error) {
			try {
				toReturn = new webkitAudioContext();					//Create a system audio context.
			} catch (error) {
				console.info('We\'re not using web audio.') 			// So if we need to call noteOn() for some other browser that doesn't support web audio, this won't work.
			}
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
		} catch (error) {
			// globalAudioContext wasn't created, we're not using web audio.
		}
	}

	// Display a button to connect to dropbox if we aren't authenticated already
	// Otherwise, load all the games, drop them in the DOM, and display the list
	function dropboxStateHandler (isAuthenticated) {
		if (!isAuthenticated) {
			mode.choose(config.modals.selectors.connect);
		} else {
			mode.enter(config.modals.menu.buttonSelector);
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
					$(document).configureUIActions(false);
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
			mode.leave(config.modals.container);
			mode.choose('', true);
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

	// Pause our game if the window loses focus
	// These also fire when an embedded document (such as an SVG embedded via <object>) is clicked
	// Get around this by setting pointer-events to none if the SVG is purely asthetic, or e.preventDefault() in a 'tap' and/or 'click' event
	// Also allows us to disable resume functionality while we're in the in-game menu
	function configurePauseResume (enabled) {
		if (enabled) {
			if (gameboy) {
				$(window).blur(function(){
					pause(true)
				});
				$(window).focus(function(){
					run(true)
				});
			}
		} else {
			$(window).off('blur');
			$(window).off('focus');
		}
	}

	function toggleGameMenu (show) {
		if (!mode.currentlyChanging()) {
			if (show) {
				pause(true);
				$(document).configureUIActions(true);
				$(config.game.wrapperSelector).addClass("blurred");
				mode.enter(config.game.menuSelector);
				configurePauseResume(false);
			} else {
				$(document).configureUIActions(false);
				$(config.game.wrapperSelector).removeClass("blurred");
				mode.leave(config.game.menuSelector);
				configurePauseResume(true);
				run(true);
			}
		}
	}

	function preloadImages (urls) {
		for (var i = 0, length = urls.length; i < length; i++) {
			$('<img/>')[0].src = urls[i];
		}
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
	attachDropboxAuth(config.dropbox.connectButtonSelector);

	
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//BINDINGS////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// Bind all our controller functions
	$.each(config.controls.bindings, function (unusedIndex, selectorArray) {
		attachTouchEvents($(buttonMask(selectorArray)));
	});

	// In-game menu bindings
	$(config.screen.selector).on("tap", function () {
		toggleGameMenu(true) });
	$(config.game.menuCloseSelector).on("tap", function () {
		toggleGameMenu(false) });
	$(config.game.resetSelector).on("tap", function () {
		restart($(config.screen.selector)[0]);
		toggleGameMenu(false);
	});
	$(config.game.quitSelector).on("tap", function () {
		stop();
		mode.choose(config.modals.selectors.loadGame);
		toggleGameMenu(false);
		mode.enter(config.modals.container);
		$(document).configureUIActions(true);
		var canvas = $(config.screen.selector)[0];
		canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
	})

	$(document).on('visibilitychange', visibilityManager);
	
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//CLOSING CONFIGURATION///////////////////////////////////////////////////////////////////////////////////////////////		
	
	// Check for debug hashes and load if enabled
	if (location.href.indexOf('#debug') !== -1) {
		config.debug.enabled = true;
		for (var debugOption in config.debug) {
			if (debugOption === 'enabled') {
				continue;
			} else if (location.href.indexOf('#' + debugOption) !== -1) {
				config.debug[debugOption] = true;
			}
		}
	}

	if (config.debug.enabled) {
		$.getScript('./scripts/rgb/debug.js'); }
	
	// Gives the user a webapp on the home screen instead of a bookmark.
	// Advantages and disadvantages to this.
	if (config.behavior.webAppCapable) {
		$('head').append('<meta name="apple-mobile-web-app-capable" content="yes">');}

	//
	if (config.behavior.newWindowLinks) {
		$("a").attr("target","_blank");}
	
	// Pause our game if the window loses focus
	// These also fire when an embedded document (such as an SVG embedded via <object>) is clicked
	// Get around this by setting pointer-events to none if the SVG is purely asthetic, or e.preventDefault() in a 'tap' and/or 'click' event
	configurePauseResume(config.behavior.pauseOnBlur);

	// Updates the settings (in io.js) according to what's in config.js (for select values)
	settings[4] 	= config.screen.gbColored;
	settings[13] 	= config.screen.smoothing;

	// Preload images
	preloadImages([
		'./resources/iconmonstr/checkbox-checked.svg',
		'./resources/iconmonstr/checkbox-empty.svg',
		'./resources/iconmonstr/cross.svg'
	]);

	initStorage();
});