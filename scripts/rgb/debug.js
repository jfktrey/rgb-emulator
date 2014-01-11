// Utilities to make development easier. This file should be ignored in production.

(function () {
///////////////////////////////////////////////////////////////////////////////////////////////
////// Set up spotneedle
	if (config.debug.remote) {
		$.getScript('https://www.spotneedle.com/observed/9a9f1b4b-d6ac-43e1-8d1c-f98905fb6adb'); }

///////////////////////////////////////////////////////////////////////////////////////////////
////// Set up the runs per second counter
	if (config.debug.rps) {
		var runFunctionBody = GameBoyCore.prototype.run.toString();
		runFunctionBody = runFunctionBody.slice(runFunctionBody.indexOf("{") + 1, runFunctionBody.lastIndexOf("}")); 	// Gives us all the code inside the GameBoyCore.prototype.run function, and only the code inside it.

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
			'\nSAVE_textNode.nodeValue = ++SAVE_count;'
		);
	}
})();