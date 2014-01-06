// Utilities to make development easier. This file should be ignored in production.

(function () {
	// Set up the runs per second counter
	if (config.debug.rpsCount) {
		var runFunctionBody = GameBoyCore.prototype.run.toString();
		runFunctionBody = runBody.slice(runBody.indexOf("{") + 1, runBody.lastIndexOf("}")); 	// Gives us all the code inside the GameBoyCore.prototype.run function, and only the code inside it.

		$('body').append('<div id="rps" style="position:fixed;bottom:0;right:0;color:#0FF;"></div>');
		window.RPScount = 1;
		window.RPSlast = Date.now();
		window.RPSsmooth = [];			//Accumulate runs here until we display their average (once every 75 iterations)
		window.logged = [];
		window.RPSnode = document.getElementById('rps');

		GameBoyCore.prototype.run = new Function(
			'var now = Date.now();' +
			'RPSsmooth.push(now - RPSlast);' +
			'RPScount++;' +
			'RPScount = RPScount % 75;' +				// Only update the display once every 75 iterations.
			'if (!RPScount) {' + 						// When we've reached 75 (so mod 75 == 0), update the display.
			'	logged.push(' +							// Store all RPS in a variable called log
			'		RPSnode.nodeValue = 1000 / ' +		// 1000 / ( [Sum of RPS collected since last update] / 75)
			'			(RPSsmooth.reduce(function (a,b) { return a + b }) / 75)' + 	// The "[Sum of RPS collected since last update] / 75" in the above comment
			'			| 0);' + 						// bitwise or with 0 gives us the floor of the above calculation
			'	RPSsmooth = [];' +
			'}' +
			'RPSlast = now;' + runBody; 				// Prepends our debug script to the GameBoyCore.prototype.run function
		);
	}

	if (config.debug.saveCount) {
		// Set up the Save counter
		$('body').append('<div id="saveCount" style="position:fixed;bottom:0;left:0;color:#FF0;"></div>');
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