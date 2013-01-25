"use strict";
var gameboy = null;						//GameBoyCore object.
var gbRunInterval = null;				//GameBoyCore Timer
var settings = [						//Some settings.
	true, 								//Turn on sound.
	true,								//Boot with boot ROM first?
	false,								//Give priority to GameBoy mode
	1,									//Volume level set.
	true,								//Colorize GB mode?
	false,								//Disallow typed arrays?
	4,									//Interval for the emulator loop.
	15,									//Audio buffer minimum span amount over x interpreter iterations.
	100,								//Audio buffer maximum span amount over x interpreter iterations.
	false,								//Override to allow for MBC1 instead of ROM only (compatibility for broken 3rd-party cartridges).
	false,								//Override MBC RAM disabling and always allow reading and writing to the banks.
	false,								//Use the GameBoy boot ROM instead of the GameBoy Color boot ROM.
	false,								//Scale the canvas in JS, or let the browser scale the canvas?
	false								//Use image smoothing based scaling?
];

var timeoutHandle = null;

function delayedSave () {
	window.clearTimeout(timeoutHandle);
	timeoutHandle = window.setTimeout(autoSave, 300);
}

function start(canvas, ROM) {
	clearLastEmulation();
	autoSave();	//If we are about to load a new game, then save the last one...
	gameboy = new GameBoyCore(canvas, ROM);
	gameboy.openMBC = openSRAM;
	gameboy.openRTC = openRTC;
	gameboy.start();
	run();
}

function run() {
	if (GameBoyEmulatorInitialized()) {
		if (!GameBoyEmulatorPlaying()) {
			gameboy.stopEmulator &= 1;
			console.info("Starting the iterator.");
			var dateObj = new Date();
			gameboy.firstIteration = dateObj.getTime();
			gameboy.iterations = 0;
			gbRunInterval = setInterval(function () {
				if (!document.hidden && !document.msHidden && !document.mozHidden && !document.webkitHidden) {
					gameboy.run();
				}
			}, settings[6]);
		}
		else {
			console.warning("The GameBoy core is already running.");
		}
	}
	else {
		console.warning("GameBoy core cannot run while it has not been initialized.");
	}
}
function pause() {
	if (GameBoyEmulatorInitialized()) {
		if (GameBoyEmulatorPlaying()) {
			clearLastEmulation();
		}
		else {
			console.warning("GameBoy core has already been paused.");
		}
	}
	else {
		console.warning("GameBoy core cannot be paused while it has not been initialized.");
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
			while (findValue("FREEZE_" + gameboy.name + "_" + state_suffix) != null) {
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
					if (findValue("SRAM_" + gameboy.name) != null) {
						//Remove the outdated storage format save:
						console.info("Deleting the old SRAM save due to outdated format.");
						deleteValue("SRAM_" + gameboy.name);
					}
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
function autoSave() {
	if (GameBoyEmulatorInitialized()) {
		saveSRAM();
		saveRTC();
	}
}
function openSRAM(filename) {
	try {
		if (findValue("B64_SRAM_" + filename) != null) {
			console.info("Found a previous SRAM state (Will attempt to load).");
			return base64ToArray(findValue("B64_SRAM_" + filename));
		}
		else if (findValue("SRAM_" + filename) != null) {
			console.info("Found a previous SRAM state (Will attempt to load).");
			return findValue("SRAM_" + filename);
		}
		else {
			console.info("Could not find any previous SRAM copy for the current ROM.");
		}
	}
	catch (error) {
		console.error("Could not open the  SRAM of the saved emulation state.");
	}
	return [];
}
function openRTC(filename) {
	try {
		if (findValue("RTC_" + filename) != null) {
			console.info("Found a previous RTC state (Will attempt to load).");
			return findValue("RTC_" + filename);
		}
		else {
			console.info("Could not find any previous RTC copy for the current ROM.");
		}
	}
	catch (error) {
		console.error("Could not open the RTC data of the saved emulation state.");
	}
	return [];
}
function openState(filename, canvas) {
	try {
		if (findValue(filename) != null) {
			try {
				clearLastEmulation();
				console.info("Attempting to run a saved emulation state.");
				gameboy = new GameBoyCore(canvas, "");
				gameboy.savedStateFileName = filename;
				gameboy.returnFromState(findValue(filename));
				run();
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
	saveString += totalLength.toLittleEndianDWORD();
	//Append the console ID text's length:
	saveString += consoleID.length.toByte();
	//Append the console ID text:
	saveString += consoleID;
	//Append the blob ID:
	saveString += keyName.length.toByte();
	saveString += keyName;
	//Now append the save data:
	saveString += encodedData.length.toLittleEndianDWORD();
	saveString += encodedData;
	return saveString;
}
function generateMultiBlob(blobPairs) {
	var consoleID = "GameBoy";
	//Figure out the initial length:
	var totalLength = 13 + 4 + 1 + consoleID.length;
	//Append the console ID text's length:
	var saveString = consoleID.length.toByte();
	//Append the console ID text:
	saveString += consoleID;
	var keyName = "";
	var encodedData = "";
	//Now append all the blobs:
	for (var index = 0; index < blobPairs.length; ++index) {
		keyName = blobPairs[index][0];
		encodedData = blobPairs[index][1];
		//Append the blob ID:
		saveString += keyName.length.toByte();
		saveString += keyName;
		//Now append the save data:
		saveString += encodedData.length.toLittleEndianDWORD();
		saveString += encodedData;
		//Update the total length:
		totalLength += 1 + keyName.length + 4 + encodedData.length;
	}
	//Now add the prefix:
	saveString = "EMULATOR_DATA" + totalLength.toLittleEndianDWORD() + saveString;
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
function GameBoyKeyDown(key) {
	if (GameBoyEmulatorInitialized() && GameBoyEmulatorPlaying()) {
		var keycode = matchKey(key);
		if (keycode >= 0 && keycode < 8) {
			gameboy.JoyPadEvent(keycode, true);
		}
	}
}
function GameBoyKeyUp(key) {
	if (GameBoyEmulatorInitialized() && GameBoyEmulatorPlaying()) {
		var keycode = matchKey(key);
		if (keycode >= 0 && keycode < 8) {
			gameboy.JoyPadEvent(keycode, false);
		}
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
//The emulator will call this to sort out the canvas properties for (re)initialization.
function initNewCanvas() {
	if (GameBoyEmulatorInitialized()) {
		gameboy.canvas.width = gameboy.canvas.clientWidth;
		gameboy.canvas.height = gameboy.canvas.clientHeight;
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