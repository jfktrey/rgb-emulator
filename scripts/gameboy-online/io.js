"use strict";
var gameboy = null;						//GameBoyCore object.
var gbRunInterval = null;				//GameBoyCore Timer
var settings = [
	true, 				// 0: Turn on sound.
	true,				// 1: Boot with boot ROM first?
	false,				// 2: Give priority to GameBoy mode
	1,					// 3: Volume level set.
	true,				// 4: Colorize GB mode?
	false,				// 5: Disallow typed arrays? 											(should never be true)
	8,					// 6: Interval for the emulator loop.
	10,					// 7: Audio buffer minimum span amount over x interpreter iterations.
	20,					// 8: Audio buffer maximum span amount over x interpreter iterations.
	false,				// 9: Override to allow for MBC1 instead of ROM only (compatibility for broken 3rd-party cartridges).
	false,				//10: Override MBC RAM disabling and always allow reading and writing to the banks.
	false,				//11: Use the GameBoy boot ROM instead of the GameBoy Color boot ROM.
	false,				//12: Scale the canvas in JS? Else, let the browser scale the canvas. 	(should never be true)
	false,				//13: Use image smoothing based scaling? 								(if you like your pixels an ugly, blurred mess, set this to true)
	300,				//14: Delay until autoSave is called. Max time until save is called is this multiplied by two.
	true,				//15: Attempt to automatically save the state for the current emulation?
	5000,				//16: Milliseconds to wait until auto state save takes place
	true,				//17: Use deflate to decrease localstorage data size (gives performance boost in everything but Safari)
	true				//18: base64-encode deflated data
];

var timeoutHandle = 0;
var sigReceivedDuringTimeout = false;
var lastLoadedRom = null;
var stateKeeperHandle = 0;
var gbRunInterval = 0;
var canAutoResume = false;

var synchronousStorageRead = [null, null];

function visibilityManager () {
	if (document.hidden) {
		pause(false, GameBoyEmulatorPlaying());
	} else if (canAutoResume) {
		run();
	}
}

function delayedSave () {
	if (timeoutHandle) {
		if (!sigReceivedDuringTimeout) sigReceivedDuringTimeout = true;
	} else {
		timeoutHandle = window.setTimeout(autoSave, settings[14]);
	}
}

function autoSave() {
	timeoutHandle = 0;
	if (sigReceivedDuringTimeout) {
		sigReceivedDuringTimeout = false;
		delayedSave();
	} else if (GameBoyEmulatorInitialized()) {
		saveSRAM();
		saveRTC();
	}
}

function start(canvas, ROM) {
	clearLastEmulation();
	lastLoadedRom = ROM;
	gameboy = new GameBoyCore(canvas, ROM);
	var romName = gameboy.getROMName();
	$.when(openSRAM(romName), openRTC(romName)).done(function (sramValue, rtcValue) {
		synchronousStorageRead[0] = sramValue;
		synchronousStorageRead[1] = rtcValue;
		console.log(synchronousStorageRead);
		gameboy.openMBC = synchronousOpenSRAM;
		gameboy.openRTC = synchronousOpenRTC;
		gameboy.start();
		run();
	});
}

function synchronousOpenSRAM () {
	return synchronousStorageRead[0];
}

function synchronousOpenRTC () {
	return synchronousStorageRead[1];
}

function stop () {
	pause();
	gameboy = null;
	synchronousStorageRead = [null, null];
}

function autosaveState () {
	setValue("FREEZE_" + gameboy.name + "_S", gameboy.strippedSaveState(), true);
}

function run(ignoreWarnings) {
	if (GameBoyEmulatorInitialized()) {
		if (!GameBoyEmulatorPlaying()) {
			gameboy.stopEmulator &= 1;
			console.info("Starting the iterator.");
			var dateObj = new Date();
			gameboy.firstIteration = dateObj.getTime();
			gameboy.iterations = 0;
			gbRunInterval = setInterval(function () {
				gameboy.run();
			}, settings[6]);
			if (settings[15]) stateKeeperHandle = setInterval(autosaveState, settings[16]);
		}
		else {
			if (!ignoreWarnings) console.warn("The GameBoy core is already running.");
		}
	}
	else {
		if (!ignoreWarnings) console.warn("GameBoy core cannot run while it has not been initialized.");
	}
}

function restart () {
	start(gameboy.canvas, lastLoadedRom);
}

function pause (ignoreWarnings, autoResume) {
	if (gameboy) {
		clearInterval(gbRunInterval);
		clearInterval(stateKeeperHandle);
		autoSave();
		autosaveState();

		if (GameBoyEmulatorInitialized()) {
			if (GameBoyEmulatorPlaying()) {
				clearLastEmulation();
			} else {
				if (!ignoreWarnings) console.warn("GameBoy core has already been paused.");
			}
		} else {
			if (!ignoreWarnings) console.warn("GameBoy core cannot be paused while it has not been initialized.");
		}
	
		canAutoResume = autoResume;
	}
}
function clearLastEmulation() {
	if (GameBoyEmulatorInitialized() && GameBoyEmulatorPlaying()) {
		clearInterval(gbRunInterval);
		gameboy.stopEmulator |= 2;
		console.info("The previous emulation has been cleared.");
	}
	else {
		console.info("No previous emulation was found to be cleared.");
	}
}
function save() {
	if (GameBoyEmulatorInitialized()) {
		try {
			var state_suffix = 0;
			var keys = keyList();
			while (keys.indexOf("FREEZE_" + gameboy.name + "_" + state_suffix) != -1) {
				state_suffix++;
			}
			setValue("FREEZE_" + gameboy.name + "_" + state_suffix, gameboy.saveState());
			console.info("Saved the current state as: FREEZE_" + gameboy.name + "_" + state_suffix);
		}
		catch (error) {
			console.error("Could not save the current emulation state(\"" + error.message + "\").");
		}
	}
	else {
		console.warn("GameBoy core cannot be saved while it has not been initialized.");
	}
}
function saveSRAM() {
	if (GameBoyEmulatorInitialized()) {
		if (gameboy.cBATT) {
			try {
				var sram = gameboy.saveSRAMState();
				if (sram.length > 0) {
					console.info("Saving the SRAM...");
					setValue("B64_SRAM_" + gameboy.name, arrayToBase64(sram));
				}
				else {
					console.warn("SRAM could not be saved because it was empty.");
				}
			}
			catch (error) {
				console.error("Could not save the current emulation state(\"" + error.message + "\").");
			}
		}
		else {
			console.warn("Cannot save a game that does not have battery backed SRAM specified.");
		}
		saveRTC();
	}
	else {
		console.warn("GameBoy core cannot be saved while it has not been initialized.");
	}
}
function saveRTC() {	//Execute this when SRAM is being saved as well.
	if (GameBoyEmulatorInitialized()) {
		if (gameboy.cTIMER) {
			try {
				console.info("Saving the RTC...");
				setValue("RTC_" + gameboy.name, gameboy.saveRTCState());
			}
			catch (error) {
				console.error("Could not save the RTC of the current emulation state(\"" + error.message + "\").");
			}
		}
	}
	else {
		console.warn("GameBoy core cannot be saved while it has not been initialized.");
	}
}
function openSRAM(filename, callback) {
	var deferred = $.Deferred();
	
	try {
		var keys = keyList();
		if (keys.indexOf("B64_SRAM_" + filename) != -1) {
			console.info("Found a previous SRAM state (Will attempt to load).");
			findValue("B64_SRAM_" + filename, function (value) {
				deferred.resolve(base64ToArray(value));
			});
		} else {
			console.info("Could not find any previous SRAM copy for the current ROM.");
			deferred.resolve([]);
		}
	}
	catch (error) {
		console.error("Could not open the SRAM of the saved emulation state.");
		deferred.resolve([]);
	}
	
	return deferred.promise();
}
function openRTC(filename, callback) {
	var deferred = $.Deferred();
	
	try {
		var keys = keyList();
		if (keys.indexOf("RTC_" + filename) != -1) {
			console.info("Found a previous RTC state (Will attempt to load).");
			findValue("RTC_" + filename, function (value) {
				deferred.resolve(value);
			});
		}
		else {
			console.info("Could not find any previous RTC copy for the current ROM.");
			deferred.resolve([]);
		}
	}
	catch (error) {
		console.error("Could not open the RTC data of the saved emulation state.");
		deferred.resolve([]);
	}

	return deferred.promise();
}
function openState(filename, canvas) {
	try {
		var keys = keyList();
		if (keys.indexOf(filename) != -1) {
			try {
				clearLastEmulation();
				console.info("Attempting to run a saved emulation state.");
				gameboy = new GameBoyCore(canvas, "");
				gameboy.savedStateFileName = filename;
				findValue(filename, function (value) {
					gameboy.returnFromState(value);
					run();
				});
			}
			catch (error) {
				alert(error.message + " file: " + error.fileName + " line: " + error.lineNumber);
			}
		}
		else {
			console.error("Could not find the save state " + filename + "\".");
		}
	}
	catch (error) {
		console.error("Could not open the saved emulation state.");
	}
}
function import_save(blobData) {
	blobData = decodeBlob(blobData);
	if (blobData && blobData.blobs) {
		if (blobData.blobs.length > 0) {
			for (var index = 0; index < blobData.blobs.length; ++index) {
				console.info("Importing blob \"" + blobData.blobs[index].blobID + "\"");
				if (blobData.blobs[index].blobContent) {
					if (blobData.blobs[index].blobID.substring(0, 5) == "SRAM_") {
						setValue("B64_" + blobData.blobs[index].blobID, btoa(blobData.blobs[index].blobContent));
					}
					else {
						setValue(blobData.blobs[index].blobID, JSON.parse(blobData.blobs[index].blobContent));
					}
				}
				else if (blobData.blobs[index].blobID) {
					console.error("Save file imported had blob \"" + blobData.blobs[index].blobID + "\" with no blob data interpretable.");
				}
				else {
					console.error("Blob chunk information missing completely.");
				}
			}
		}
		else {
			console.error("Could not decode the imported file.");
		}
	}
	else {
		console.error("Could not decode the imported file.");
	}
}
function generateBlob(keyName, encodedData) {
	//Append the file format prefix:
	var saveString = "EMULATOR_DATA";
	var consoleID = "GameBoy";
	//Figure out the length:
	var totalLength = (saveString.length + 4 + (1 + consoleID.length)) + ((1 + keyName.length) + (4 + encodedData.length));
	//Append the total length in bytes:
	saveString += toLittleEndianDWORD(totalLength);
	//Append the console ID text's length:
	saveString += toByte(consoleID.length);
	//Append the console ID text:
	saveString += consoleID;
	//Append the blob ID:
	saveString += toByte(keyName.length);
	saveString += keyName;
	//Now append the save data:
	saveString += toLittleEndianDWORD(encodedData.length);
	saveString += encodedData;
	return saveString;
}
function generateMultiBlob(blobPairs) {
	var consoleID = "GameBoy";
	//Figure out the initial length:
	var totalLength = 13 + 4 + 1 + consoleID.length;
	//Append the console ID text's length:
	var saveString = toByte(consoleID.length);
	//Append the console ID text:
	saveString += consoleID;
	var keyName = "";
	var encodedData = "";
	//Now append all the blobs:
	for (var index = 0; index < blobPairs.length; ++index) {
		keyName = blobPairs[index][0];
		encodedData = blobPairs[index][1];
		//Append the blob ID:
		saveString += toByte(keyName.length);
		saveString += keyName;
		//Now append the save data:
		saveString += toLittleEndianDWORD(encodedData.length);
		saveString += encodedData;
		//Update the total length:
		totalLength += 1 + keyName.length + 4 + encodedData.length;
	}
	//Now add the prefix:
	saveString = "EMULATOR_DATA" + toLittleEndianDWORD(totalLength) + saveString;
	return saveString;
}
function decodeBlob(blobData) {
	/*Format is as follows:
		- 13 byte string "EMULATOR_DATA"
		- 4 byte total size (including these 4 bytes).
		- 1 byte Console type ID length
		- Console type ID text of 8 bit size
		blobs {
			- 1 byte blob ID length
			- blob ID text (Used to say what the data is (SRAM/freeze state/etc...))
			- 4 byte blob length
			- blob length of 32 bit size
		}
	*/
	var length = blobData.length;
	var blobProperties = {};
	blobProperties.consoleID = null;
	var blobsCount = -1;
	blobProperties.blobs = [];
	if (length > 17) {
		if (blobData.substring(0, 13) == "EMULATOR_DATA") {
			var length = Math.min(((blobData.charCodeAt(16) & 0xFF) << 24) | ((blobData.charCodeAt(15) & 0xFF) << 16) | ((blobData.charCodeAt(14) & 0xFF) << 8) | (blobData.charCodeAt(13) & 0xFF), length);
			var consoleIDLength = blobData.charCodeAt(17) & 0xFF;
			if (length > 17 + consoleIDLength) {
				blobProperties.consoleID = blobData.substring(18, 18 + consoleIDLength);
				var blobIDLength = 0;
				var blobLength = 0;
				for (var index = 18 + consoleIDLength; index < length;) {
					blobIDLength = blobData.charCodeAt(index++) & 0xFF;
					if (index + blobIDLength < length) {
						blobProperties.blobs[++blobsCount] = {};
						blobProperties.blobs[blobsCount].blobID = blobData.substring(index, index + blobIDLength);
						index += blobIDLength;
						if (index + 4 < length) {
							blobLength = ((blobData.charCodeAt(index + 3) & 0xFF) << 24) | ((blobData.charCodeAt(index + 2) & 0xFF) << 16) | ((blobData.charCodeAt(index + 1) & 0xFF) << 8) | (blobData.charCodeAt(index) & 0xFF);
							index += 4;
							if (index + blobLength <= length) {
								blobProperties.blobs[blobsCount].blobContent =  blobData.substring(index, index + blobLength);
								index += blobLength;
							}
							else {
								console.error("Blob length check failed, blob determined to be incomplete.");
								break;
							}
						}
						else {
							console.error("Blob was incomplete, bailing out.");
							break;
						}
					}
					else {
						console.error("Blob was incomplete, bailing out.");
						break;
					}
				}
			}
		}
	}
	return blobProperties;
}
function matchKey(key) {	//Maps a keyboard key to a gameboy key.
	//Order: Right, Left, Up, Down, A, B, Select, Start
	var keymap = ["right", "left", "up", "down", "a", "b", "select", "start"];	//Keyboard button map.
	for (var index = 0; index < keymap.length; index++) {
		if (keymap[index] == key) {
			return index;
		}
	}
	return -1;
}
function GameBoyEmulatorInitialized() {
	return (typeof gameboy == "object" && gameboy != null);
}
function GameBoyEmulatorPlaying() {
	return ((gameboy.stopEmulator & 2) == 0);
}
function GameBoyKeyDown(keys) {
	if (typeof(keys) === 'string') {
		$.each(keys.split(' '), function (unusedIndex, key) {
			if (GameBoyEmulatorInitialized() && GameBoyEmulatorPlaying()) {
				var keycode = matchKey(key);
				if (keycode >= 0 && keycode < 8) {
					gameboy.JoyPadEvent(keycode, true);
				}
			}
		});
	}
}
function GameBoyKeyUp(keys) {
	if (typeof(keys) === 'string') {
		$.each(keys.split(' '), function (unusedIndex, key) {
			if (GameBoyEmulatorInitialized() && GameBoyEmulatorPlaying()) {
				var keycode = matchKey(key);
				if (keycode >= 0 && keycode < 8) {
					gameboy.JoyPadEvent(keycode, false);
				}
			}
		});
	}
}
function GameBoyGyroSignalHandler(e) {
	if (GameBoyEmulatorInitialized() && GameBoyEmulatorPlaying()) {
		if (e.gamma || e.beta) {
			gameboy.GyroEvent(e.gamma * Math.PI / 180, e.beta * Math.PI / 180);
		}
		else {
			gameboy.GyroEvent(e.x, e.y);
		}
		try {
			e.preventDefault();
		}
		catch (error) { }
	}
}
//Call this when resizing the canvas:
function initNewCanvasSize() {
	if (GameBoyEmulatorInitialized()) {
		if (!settings[12]) {
			if (gameboy.onscreenWidth != 160 || gameboy.onscreenHeight != 144) {
				gameboy.initLCD();
			}
		}
		else {
			if (gameboy.onscreenWidth != gameboy.canvas.clientWidth || gameboy.onscreenHeight != gameboy.canvas.clientHeight) {
				gameboy.initLCD();
			}
		}
	}
}