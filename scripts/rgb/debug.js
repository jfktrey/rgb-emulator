// Utilities to make development easier. This file should be ignored in production.

window.debug = {
	patch: {
		console:	{	original: {
							log:	console.log,
							info:	console.info,
							warn:	console.warn,
							error:	console.error },
						patched:	false },

		run:		{	original:	GameBoyCore.prototype.run,
						patched:	false },

		save:		{	original:	saveSRAM,
						patched:	false },

		state:		{	original:	autosaveState,
						patched:	false }
	},

	domlog: function (enable) {
		if (enable) {
			if (!debug.patch.console.patched) {
				console.log = function () {
					debug.patch.console.original.log.apply(console, arguments);
					$('#debugMessages').prepend('<li class="consoleLog">' + argumentStringify(arguments) + '</li>');
				}
				
				console.info = function () {
					debug.patch.console.original.info.apply(console, arguments);
					$('#debugMessages').prepend('<li class="consoleInfo">' + argumentStringify(arguments) + '</li>');
				}
				
				console.warn = function () {
					debug.patch.console.original.warn.apply(console, arguments);
					$('#debugMessages').prepend('<li class="consoleWarn">' + argumentStringify(arguments) + '</li>');
				}
				
				console.error = function () {
					debug.patch.console.original.error.apply(console, arguments);
					$('#debugMessages').prepend('<li class="consoleError">' + argumentStringify(arguments) + '</li>');
				}
		
				argumentStringify = function (args) {
					strings = [];
					for (var i = 0; i < args.length; i++) {
						try {
							var parsedArg = JSON.stringify(args[i]);
						} catch (e) {
							var parsedArg = args[i] + "";
						}
						if ((parsedArg[0] === "\"") && (parsedArg[parsedArg.length - 1] === "\"")) {
							parsedArg = parsedArg.substr(1, parsedArg.length - 2); }
						strings.push(parsedArg);
					}
					return strings.join(', ');
				}
			}
		} else {
			console.log		= debug.patch.console.original.log;
			console.info	= debug.patch.console.original.info;
			console.warn	= debug.patch.console.original.warn;
			console.error	= debug.patch.console.original.error;
		}
	},

	run: function (enable) {
		if (enable) {
			if (!debug.patch.run.patched) {
				debug.patch.run.patched = true;

				var runFunctionBody = window.getFunctionBody(debug.patch.run.original); 	// Gives us all the code inside the GameBoyCore.prototype.run function, and only the code inside it.

				$('body').append('<div id="rps">0</div>');
				window.RPS_count = 1;
				window.RPS_last = Date.now();
				window.RPS_smooth = [];			//Accumulate runs here until we display their average (once every 75 iterations)
				window.RPS_logged = [];
				window.RPS_average = 0;
				window.RPS_new = 0;
				window.RPS_textNode = document.getElementById('rps').firstChild;
		
				GameBoyCore.prototype.run = new Function(
					'var now = Date.now();' +
					'RPS_smooth.push(now - RPS_last);' +
					'if (!(RPS_count = ++RPS_count % 75)) {' + 	// When we've reached 75 (so mod 75 == 0), update the display.
					'	RPS_logged.push(' +						// Store all RPS in a variable called log
					'		RPS_new = 1000 / (RPS_smooth.reduce(function (a,b) { return a + b }) / 75));' + 	// 1000ms / ()
					'	RPS_smooth = [];' +
					'	RPS_textNode.nodeValue = RPS_average = ((((RPS_logged.length - 1) * RPS_average) + RPS_new) / RPS_logged.length) | 0' +
					'}' +
					'RPS_last = now;' + runFunctionBody 			// Prepends our debug script to the GameBoyCore.prototype.run function
				);
			}
		} else {
			debug.patch.run.patched = false;
			GameBoyCore.prototype.run = debug.patch.run.original;
			$("#rps").remove();
		}
	},

	save: function (enable) {
		if (enable) {
			if (!debug.patch.save.patched) {
				debug.patch.save.patched = true;

				var saveFunctionBody = window.getFunctionBody(debug.patch.save.original);
		
				$('body').append('<div id="saveCount">0</div>');
				window.SAVE_count = 0;
				window.SAVE_textNode = document.getElementById('saveCount').firstChild;
		
				window.saveSRAM = new Function(
					saveFunctionBody + 
					';SAVE_textNode.nodeValue = ++SAVE_count;'
				);
			}
		} else {
			debug.patch.save.patched = false;
			window.saveSRAM = debug.patch.save.original;
			$("#saveCount").remove();
		}
	},

	state: function (enable) {
		if (enable) {
			if (!debug.patch.state.patched) {
				debug.patch.state.patched = true;

				var stateFunctionBody = window.getFunctionBody(debug.patch.state.original);
		
				$('body').append('<div id="stateCount">0</div>');
				window.STATE_count = 0;
				window.STATE_textNode = document.getElementById('stateCount').firstChild;
		
				window.autosaveState = new Function(
					stateFunctionBody +
					';STATE_textNode.nodeValue = ++STATE_count;'
				);
			}
		} else {
			debug.patch.state.patched = false;
			window.autosaveState = debug.patch.state.original;
			$("#stateCount").remove();
		}
	}
};

$(config.modals.triggers.debugMenu).show();

$(config.modals.selectors.debugMenu).find("ul.itemList li").each(function () {
	$(this).find(".toggleswitch").toggleit({
		width: 50,
		height: 22,
		displayCheck: true,
		changed: (function ($that) {
			return function (ui) {
				debug[$that.data("debug-option")](ui.checked);
			}
		})($(this).find(".toggleswitch"))
	});
});

$(config.modals.selectors.debugMenu).find(".toggleswitch").parent().each(function () {
	$(this).click(function (event) {
		if ($(event.target).is(this)) {
			var that = $(this).find(".toggleIt-container")[0];
			$(that).data("events").click[0].handler.call(that);
		}
	});
});

debug.domlog(true);