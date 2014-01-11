// Utilities to make development easier. This file should be ignored in production.

(function () {
	// Set up the runs per second counter
	if (config.debug.rps) {
		var runFunctionBody = GameBoyCore.prototype.run.toString();
		runFunctionBody = runFunctionBody.slice(runFunctionBody.indexOf("{") + 1, runFunctionBody.lastIndexOf("}")); 	// Gives us all the code inside the GameBoyCore.prototype.run function, and only the code inside it.

		$('body').append('<div id="rps">0</div>');
		window.RPScount = 1;
		window.RPSlast = Date.now();
		window.RPSsmooth = [];			//Accumulate runs here until we display their average (once every 75 iterations)
		window.RPSlogged = [];
		window.RPSaverage = 0;
		window.RPSnew = 0;
		window.RPSnode = document.getElementById('rps');
		window.RPStext = RPSnode.firstChild;

		GameBoyCore.prototype.run = new Function(
			'var now = Date.now();' +
			'RPSsmooth.push(now - RPSlast);' +
			'if (!(RPScount = ++RPScount % 75)) {' + 	// When we've reached 75 (so mod 75 == 0), update the display.
			'	RPSlogged.push(' +						// Store all RPS in a variable called log
			'		RPSnew = 1000 / (RPSsmooth.reduce(function (a,b) { return a + b }) / 75));' + 	// The "[Sum of RPS collected since last update] / 75" in the above comment
			'	RPSsmooth = [];' +
			'	RPStext.nodeValue = RPSaverage = (((RPSlogged.length - 1) * RPSaverage) + RPSnew) / RPSlogged.length' +
			'}' +
			'RPSlast = now;' + runFunctionBody 			// Prepends our debug script to the GameBoyCore.prototype.run function
		);
	}

	if (config.debug.saves) {
		// Set up the Save counter
		$('body').append('<div id="saveCount">0</div>');
		window.saveCount = 0;
		document.getElementById('saveCount').innerHTML = saveCount;

		window.autoSave = function () {
			timeoutHandle = 0;
			if (sigReceivedDuringTimeout) {
				sigReceivedDuringTimeout = false;
				delayedSave();
			} else if (GameBoyEmulatorInitialized()) {
				saveCount++;
				document.getElementById('saveCount').innerHTML = saveCount;
				saveSRAM();
				saveRTC();
			}
		}
	}
	
	// Set up spotneedle
	if (config.debug.remote) {
		$.getScript('https://www.spotneedle.com/observed/9a9f1b4b-d6ac-43e1-8d1c-f98905fb6adb'); }
})();