// JavaScript Audio Resampler (c) 2011 - Grant Galitz
// Stripped down for JSGBC - Trey
function Resampler(fromSampleRate, toSampleRate, channels, outputBufferSize, noReturn) {
	this.fromSampleRate = fromSampleRate;
	this.toSampleRate = toSampleRate;
	this.channels = channels | 0;
	this.outputBufferSize = outputBufferSize;
	this.noReturn = !!noReturn;
	this.initialize();
}
Resampler.prototype.initialize = function () {
	//Perform some checks:
	if (this.fromSampleRate > 0 && this.toSampleRate > 0 && this.channels > 0) {
		this.tailExists = false;
		this.lastWeight = 0;
		
		this.ratioWeight = this.fromSampleRate / this.toSampleRate;
		this.initializeBuffers();
	} else {
		throw(new Error("Invalid settings specified for the resampler."));
	}
}
Resampler.prototype.bufferSlice = function (sliceAmount) {
	if (this.noReturn) {
		//If we're going to access the properties directly from this object:
		return sliceAmount;
	}
	else {
		//Typed array and normal array buffer section referencing:
		try {
			return this.outputBuffer.subarray(0, sliceAmount);
		}
		catch (error) {
			try {
				//Regular array pass:
				this.outputBuffer.length = sliceAmount;
				return this.outputBuffer;
			}
			catch (error) {
				//Nightly Firefox 4 used to have the subarray function named as slice:
				return this.outputBuffer.slice(0, sliceAmount);
			}
		}
	}
}
Resampler.prototype.initializeBuffers = function () {
	//Initialize the internal buffer:
	try {
		this.outputBuffer = new Float32Array(this.outputBufferSize);
		this.lastOutput = new Float32Array(this.channels);
	}
	catch (error) {
		this.outputBuffer = [];
		this.lastOutput = [];
	}
}

Resampler.prototype.resampler = function (buffer) {
	var bufferLength = buffer.length;
	var outLength = this.outputBufferSize;
	
	if ((bufferLength % 2) === 0) {
		if (bufferLength > 0) {
			var ratioWeight = this.ratioWeight;
			var weight = 0;
			var output0 = 0;
			var output1 = 0;
			var actualPosition = 0;
			var amountToNext = 0;
			var alreadyProcessedTail = !this.tailExists;
			this.tailExists = false;
			var outputBuffer = this.outputBuffer;
			var outputOffset = 0;
			var currentPosition = 0;
			do {
				if (alreadyProcessedTail) {
					weight = ratioWeight;
					output0 = 0;
					output1 = 0;
				} else {
					weight = this.lastWeight;
					output0 = this.lastOutput[0];
					output1 = this.lastOutput[1];
					alreadyProcessedTail = true;
				}
				while (weight > 0 && actualPosition < bufferLength) {
					amountToNext = 1 + actualPosition - currentPosition;
					if (weight >= amountToNext) {
						output0 += buffer[actualPosition++] * amountToNext;
						output1 += buffer[actualPosition++] * amountToNext;
						currentPosition = actualPosition;
						weight -= amountToNext;
					} else {
						output0 += buffer[actualPosition] * weight;
						output1 += buffer[actualPosition + 1] * weight;
						currentPosition += weight;
						weight = 0;
						break;
					}
				}
				if (weight === 0) {
					outputBuffer[outputOffset++] = output0 / ratioWeight;
					outputBuffer[outputOffset++] = output1 / ratioWeight;
				} else {
					this.lastWeight = weight;
					this.lastOutput[0] = output0;
					this.lastOutput[1] = output1;
					this.tailExists = true;
					break;
				}
			} while (actualPosition < bufferLength && outputOffset < outLength);
			
			return this.bufferSlice(outputOffset);
		} else {
			return (this.noReturn) ? 0 : [];
		}
	} else {
		throw(new Error("Buffer was of incorrect sample length."));
	}
}