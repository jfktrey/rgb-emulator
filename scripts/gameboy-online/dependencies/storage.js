var database = asyncStorage.create("rgb-data", function (db, numberOfEntries) {});

function initDeflate () {
	window.deflateWorker = new Worker('./scripts/gameboy-online/dependencies/rawdeflate.js');
	deflateWorker.onmessage = function (e) {
		database.setItem(e.data.key, e.data.value, function (value, key) {
			console.log("Set data " + e.data.key + " asynchronously.");
		});
	} ;
}

function keyList () {
	var list = [];
	for (var i = 0, length = database.length; i < length; i++) {
		list.push(findKey(i)); }
	return list;
}

function findValue (key, callback) {
	database.getItem(key, (function (callbackClosure, useDeflate, useB64) {
		return function (value, key) {
			console.log(value);
			if (useB64) value = atob(value);
			if (useDeflate) value = RawDeflate.inflate(value);
			callbackClosure(JSON.parse(value), key);
		}
	})(callback, settings[17], settings[18]));
}

function setValue (key, value, untype) {
	deflateWorker.postMessage({
		'key':		key,
		'value':	value,
		'deflate':	settings[17],
		'base64':	settings[18],
		'untype':	untype
	});
}

function deleteValue (key) {
	database.removeItem(key);
}

function checkStorageLength() {
	return database.length;
}

function findKey (keyNum) {
	return database.key(keyNum);
}

function getLocalStorageKeys () {
	var storageLength = checkStorageLength();
	var keysFound = [];
	var index = 0;
	var nextKey = null;
	while (index < storageLength) {
		nextKey = findKey(index++);
		if (nextKey !== null && nextKey.length > 0) {
			if (nextKey.substring(0, 5) === "SRAM_" || nextKey.substring(0, 9) === "B64_SRAM_" || nextKey.substring(0, 7) === "FREEZE_" || nextKey.substring(0, 4) === "RTC_") {
				keysFound.push(nextKey);
			}
		}
		else {
			break;
		}
	}
	return keysFound;
}

function localStorageURL (keyName, dataFound, downloadName) {
	return "data:application/octet-stream;base64," + dataFound;
}

function getBlobPreEncoded (keyName) {
	if			(keyName.substring(0, 9) === "B64_SRAM_") {
		return [keyName.substring(4), base64_decode(findValue(keyName))];
		
	} else if	(keyName.substring(0, 5) === "SRAM_") {
		return [keyName, convertToBinary(findValue(keyName))];
		
	} else {
		return [keyName, JSON.stringify(findValue(keyName))];
		
	}
}

function convertToBinary (jsArray) {
	var length = jsArray.length;
	var binString = "";
	for (var indexBin = 0; indexBin < length; indexBin++) {
		binString += String.fromCharCode(jsArray[indexBin]);
	}
	return binString;
}

function arrayToBase64(arrayIn) {
	var binString = "",
		length = arrayIn.length;

	for (var index = 0; index < length; ++index) {
		if (typeof arrayIn[index] == "number") {
			binString += String.fromCharCode(arrayIn[index]);
		}
	}
	return btoa(binString);
}

function base64ToArray(b64String) {
	var binString = atob(b64String),
		outArray = [],
		length = binString.length;
	
	for (var index = 0; index < length;) {
		outArray.push(binString.charCodeAt(index++) & 0xFF);
	}
	return outArray;
}

function toLittleEndianDWORD () {		// this & 0xFF === this mod 256
	return	String.fromCharCode( this			& 0xFF,		// first 8 bits from right
								(this >> 8 )	& 0xFF,		// second 8 bits, and so on.
								(this >> 16)	& 0xFF,
								(this >> 24)	& 0xFF);
}

function toByte () {
	return String.fromCharCode(this & 0xFF);
}