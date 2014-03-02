// Utilities to make development easier. This file should be ignored in production.

(function () {
///////////////////////////////////////////////////////////////////////////////////////////////
////// Set up spotneedle
	if (config.debug.remote) {
		$.getScript('https://www.spotneedle.com/observed/9a9f1b4b-d6ac-43e1-8d1c-f98905fb6adb'); }

///////////////////////////////////////////////////////////////////////////////////////////////
////// Set up spotneedle
	if (config.debug.domlog) {
		$(config.modals.selectors.mainMenu).first().children().append('<li id="mmConsole"><img class="listItemIcon" src="./resources/iconmonstr/bug.svg">Debug Messages</li>');
		$('#mmConsole').click(function(){
			mode.choose('#debugMessages');
		});

		$('<div id="debugMessages" class="fastFade"><ul class="itemList"></ul></div>').insertBefore($('#modes > :last-child'));

		var console_log = console.log;
		var console_info = console.info;
		var console_warn = console.warn;
		var console_error = console.error;
		
		console.log = function () {
			console_log.apply(console, arguments);
			$('#debugMessages').first().children().append('<li class="consoleLog">' + argumentStringify(arguments) + '</li>');
		}
		
		console.warn = function () {
			console_warn.apply(console, arguments);
			$('#debugMessages').first().children().append('<li class="consoleWarn">' + argumentStringify(arguments) + '</li>');
		}
		
		console.info = function () {
			console_info.apply(console, arguments);
			$('#debugMessages').first().children().append('<li class="consoleInfo">' + argumentStringify(arguments) + '</li>');
		}
		
		console.error = function () {
			console_error.apply(console, arguments);
			$('#debugMessages').first().children().append('<li class="consoleError">' + argumentStringify(arguments) + '</li>');
		}

		argumentStringify = function (args) {
			strings = [];
			for (var i = 0; i < args.length; i++) {
				var parsedArg = JSON.stringify(args[i]);
				if ((parsedArg[0] === "\"") && (parsedArg[parsedArg.length - 1] === "\"")) {
					parsedArg = parsedArg.substr(1, parsedArg.length - 2); }
				strings.push(parsedArg);
			}
			return strings.join(', ');
		}
	}

	if (config.debug.state) {
		// These two lines give us all the code inside the saveSRAM function, and only the code inside it.
		var stateFunctionBody = window.getFunctionBody(setupStateKeeper);
		var stateSplit = stateFunctionBody.split("}");
		var stateEnd = stateSplit.pop();
		stateFunctionBody = stateSplit.join("}") + ';STATE_textNode.nodeValue = ++STATE_count;' + "}" + stateEnd;

		$('body').append('<div id="stateCount">0</div>');
		window.STATE_count = 0;
		window.STATE_textNode = document.getElementById('stateCount').firstChild;

		window.setupStateKeeper = new Function(stateFunctionBody);
	}

///////////////////////////////////////////////////////////////////////////////////////////////
////// Set up the runs per second counter
	if (config.debug.rps) {
		runFunctionBody = window.getFunctionBody(GameBoyCore.prototype.run); 	// Gives us all the code inside the GameBoyCore.prototype.run function, and only the code inside it.

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
			'	RPS_textNode.nodeValue = RPS_average = (((RPS_logged.length - 1) * RPS_average) + RPS_new) / RPS_logged.length' +
			'}' +
			'RPS_last = now;' + runFunctionBody 			// Prepends our debug script to the GameBoyCore.prototype.run function
		);
	}

///////////////////////////////////////////////////////////////////////////////////////////////
////// Set up the Save counter
	if (config.debug.saves) {
		// These two lines give us all the code inside the saveSRAM function, and only the code inside it.
		var saveFunctionBody = saveSRAM.toString();
		saveFunctionBody = saveFunctionBody.slice(saveFunctionBody.indexOf("{") + 1, saveFunctionBody.lastIndexOf("}"));

		$('body').append('<div id="saveCount">0</div>');
		window.SAVE_count = 0;
		window.SAVE_textNode = document.getElementById('saveCount').firstChild;

		window.saveSRAM = new Function(
			saveFunctionBody + 
			';SAVE_textNode.nodeValue = ++SAVE_count;'
		);
	}
})();