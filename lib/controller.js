(function () {
	var util = require('util'),
		events = require('events'),
		HID = require('node-hid');
	
	//our generic controller object, it will need a controller Configuration with a buttons array passed into its connect function.
	var controller = function () {
		//store the analog data in the buffer.
		var controllerConfiguration = null;
		var hidDevice = null;
		//we will use this bugger to keep track of changes.
		var buffer = {};
		//the amount of variance is allowed on the analog sticks before any event is invoked,
		//usually depending on the controller an amount of noise will be introduced
		var varianceThreshhold = 1;
		var buttonBlock = null;
		var buttonValue = null;
		//for some reason HID will sometimes not read.
		var deviceReadOk = false;

		//noticed there was a bit on noise from the controller.
		var isWithinVariance = function (x, y) {
			return Math.abs(x - y) > varianceThreshhold;
		};

		this.checkIfreceiving = function () {
			if (!deviceReadOk) {
				this.emit("error", "the device failed to read, retrying");
				this.deviceRead();
				this.connect();
			}
		};

		this.deviceRead = function () {
			//call device read again.
			hidDevice.read(processFrame.bind(this));
		};
		
		//process data from HID connected device.
		var processFrame = function (error, data) {
			//make sure the buffer is not null.
			if(error) {
				this.emit('error', error);
			}
			//we have read.
			deviceReadOk = true;
			//only process analog data if controller has analog sticks.
			//current analog state.
			var analog = {
				leftY : data[controllerConfiguration.leftAnalogY],
				leftX : data[controllerConfiguration.leftAnalogX],
				rightY : data[controllerConfiguration.rightAnalogY],
				rightX : data[controllerConfiguration.rightAnalogX]
			};
			
			//make sure the buffer is not null.
			buffer.analog = buffer.analog || analog;

			//check the left analog for movement.
			if (isWithinVariance(buffer.analog.leftY, analog.leftY) || isWithinVariance(buffer.analog.leftX, analog.leftX)) {
				this.emit('left:move', {
					x : analog.leftX,
					y : analog.leftY
				});
			}

			//check the right analog for movement
			if (isWithinVariance(buffer.analog.rightY, analog.rightY) || isWithinVariance(buffer.analog.rightX, analog.rightX)) {
				this.emit('right:move', {
					x : analog.rightX,
					y : analog.rightY
				});
			}
			//store the analog data in the buffer.
			buffer.analog = analog;
			//process the input data for button events.
			for (var button in controllerConfiguration.buttons) {

				buttonBlock = data[controllerConfiguration.buttons[button].buttonBlock];
				buttonValue = controllerConfiguration.buttons[button].buttonValue;

				if (buttonBlock & buttonValue) {
					if(!buffer.buttonStates[button].pressed) {
						buffer.buttonStates[button].pressed = true;
						this.emit(button + ":pressed", button);
					}
					//button is not pressed, check if it was pressed.
				} else {
					if(buffer.buttonStates[button].pressed) {
						buffer.buttonStates[button].pressed = false;
						this.emit(button + ":release", button);
					}
				}
			}
			//read from the hid device.
			this.deviceRead();

		};

		//init the controller, setting configuration values and default states.
		this.init = function (controllerConfig) {

			//init the private members;
			controllerConfiguration = controllerConfig;
			buffer.buttonStates = {};

			//prime the button states
			for (var button in controllerConfiguration.buttons) {
				buffer.buttonStates[button] = {
					pressed : false
				};
			}
		};

		//initiate the HID connection with the device, use the vendorId and product Id to identify the controller
		this.connect = function (){

			//connect to the device.
			hidDevice = new HID.HID(controllerConfiguration.vendorId, controllerConfiguration.productId);
			this.emit('connect');

			//start the read loop
			try {
				//read from the hid device.
				this.deviceRead();
			} catch (ex) {
				this.emit('error', ex);
			}
			setTimeout(this.checkIfreceiving.bind(this), 500);
		};
		return this;

	};
	//need to inherit from event emiter.
	util.inherits(controller, events.EventEmitter);
	module.exports = new controller();

}());
