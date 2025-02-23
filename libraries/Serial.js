// This is our custom web component, which implements Serial port access
class Serial {

    constructor() {
        // class variables
        this.keepReading = true;
        this.delimiterChar = 0x0A;
        this.tokenBuffer = new Uint8Array();
        this.connectBaudRate = 115200;
        this.connectedUSBPort = null;       // USB connection
        this.uBitBTDevice = null;           // Bluetooth connection
        
        // constants
    }

    // Connect or Disconnect Microbit over USB Port.
    // If status at end of function is 'connected' returns true, else returns false
    async toggleUSBConnection() {
        const USB_VENDOR_ID = 0x0d28;       // microbit USB Identifier
       
        if (!this.connectedUSBPort) { 
            // look for an attached microbit
            try {
                this.connectedUSBPort = await navigator.serial.requestPort({ filters: [{ usbVendorId: USB_VENDOR_ID }]});
                
                // Connect to port
                const baud = this.connectBaudRate;
                if (!baud) {
                    console.warn(`Invalid baud rate ${this.connectBaudRate}`);
                    return false;
                } else {
                    await this.connectedUSBPort.open({ baudRate: baud });
                    this.keepReading = true;
                    this.finishedReadingPromise = this.readSerialInput();
                    return true;
                }
                
            } catch(e) {
                console.warn(`Couldn't find any microbits: ${e}`);
                return false;
            }

        } else {
            // disconnect
            try {
                this.keepReading = false;
                this.reader.cancel();
                await this.finishedReadingPromise;
                this.connectedUSBPort = null;
                return false; // returning false indicates that the current state is disconnected
            } catch (e) {
                console.warn(`Error disconnecting from microbit: ${e}`);
                this.connectedUSBPort = null;
                return false; // if we can't disconnect, we probably aren't properly connected
            }
        }
    }

    // Report on whether USB is connected or not
    IsUSBConnected() {
        return (this.connectedUSBPort ? true : false); 
    }

    // Connect or Disconnect Microbit over Bluetooth.
    // If status at end of function is 'connected' returns true, else returns false
    async toggleBluetoothConnection() {
        const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";            // microbit bluetooth identifier
        const UART_TX_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";  // Allows the micro:bit to transmit a byte array
        const UART_RX_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";  // Allows a connected client to send a byte array   

        if (!this.uBitBTDevice) {
            try {
                console.log("Requesting Bluetooth Device...");
                this.uBitBTDevice = await navigator.bluetooth.requestDevice({
                    filters: [{ namePrefix: "BBC micro:bit" }],
                    optionalServices: [UART_SERVICE_UUID]
                });
            
                console.log("Connecting to GATT Server...");
                const server = await this.uBitBTDevice.gatt.connect();
            
                console.log("Getting Service...");
                const service = await server.getPrimaryService(UART_SERVICE_UUID);
            
                console.log("Getting Characteristics...");
                const txCharacteristic = await service.getCharacteristic(
                    UART_TX_CHARACTERISTIC_UUID
                );
                txCharacteristic.startNotifications();
                txCharacteristic.addEventListener(
                    "characteristicvaluechanged",
                    this.onTxCharacteristicValueChanged.bind(this)
                );
                this.rxCharacteristic = await service.getCharacteristic(
                    UART_RX_CHARACTERISTIC_UUID
                );
                
                // Successfully connected to Bluetooth, so change status of button
                return true;

            } catch (error) {
                this.uBitBTDevice = null;
                this.rxCharacteristic = null;
                console.log(error);
                return false;
            }

        } else {
            try {
                this.disconnectBluetooth();
                this.uBitBTDevice = null;
                this.rxCharacteristic = null;
                return false;       // return value of false indicates bluetooth is not connected
                
            } catch (e) {
                console.warn(`Error disconnecting from bluetooth: ${e}`);
                this.uBitBTDevice = null;
                return false;       // assume that if disconnection fails, it wasn't properly connected
            } 
        }
    }

    // Report on whether USB is connected or not
    IsBluetoothConnected() {
        return (this.uBitBTDevice ? true : false); 
    }

    // Bluetooth functions
    disconnectBluetooth() {
        if (!this.uBitBTDevice) { return; }
      
        if (this.uBitBTDevice.gatt.connected) {
          this.uBitBTDevice.gatt.disconnect();
          console.log("Disconnected from Bluetooth");
        }
    }
            
    onTxCharacteristicValueChanged(event) {
        let receivedData = [];
        for (var i = 0; i < event.target.value.byteLength; i++) {
            receivedData[i] = event.target.value.getUint8(i);
        }
    
        const receivedString = String.fromCharCode.apply(null, receivedData);
        const val = receivedString.trim();
        this.dispatchMessage(val);
    }
    
    // Decode tokens as UTF8 strings and invoke any custom message handler
    handleToken = function(arr) {
        const stringValue = new TextDecoder().decode(arr);
        const val = stringValue.trim();
        this.dispatchMessage(val);
    }

    dispatchMessage = function(msg) {
        if (this.customHandler) {
            this.customHandler(msg);
        } else {
            console.log(msg);
        }
    }
    
    // Enable the parser to handle arbitrarily large messages
    expandTokenBuffer(arr) {
        let expandedBuffer = new Uint8Array(this.tokenBuffer.length + arr.length);
        expandedBuffer.set(this.tokenBuffer);
        expandedBuffer.set(arr, this.tokenBuffer.length);
        this.tokenBuffer = expandedBuffer;
    }
      
    // do the actual parsing
    serialInputProcessor(arr) {
        if (arr && arr.length) {            
            let ind = arr.indexOf(this.delimiterChar);
            if (ind >= 0) {
                if (ind > 0) {
                    let part = arr.slice(0, ind);
                    this.expandTokenBuffer(part);
                }    
                try {
                    this.handleToken(this.tokenBuffer);
                } catch(e) {
                    console.log(`Malformed token ${this.tokenBuffer}: ${e}`);
                }
                this.tokenBuffer = new Uint8Array(); 
                this.serialInputProcessor(arr.subarray(ind+1));
            } else {
                this.expandTokenBuffer(arr);
            }
        }
    }
    
    
    // listen for data on the serial port
    async readSerialInput() {
        while (this.connectedUSBPort.readable && this.keepReading) {
            this.reader = this.connectedUSBPort.readable.getReader();
            try {
              while (true) {
                const { value, done } = await this.reader.read();
                if (done) {
                  // reader has been canceled.
                  break;
                }
                if (this.logFileWriter) {
                    const stringValue = new TextDecoder().decode(value);
                    this.logFileWriter.write(stringValue);
                }        
                this.serialInputProcessor(value);
              }
            } catch (error) {
              console.warn(`Error parsing serial input: ${error}`);
            } finally {
              this.reader.releaseLock();
            }
        }
    
        await this.connectedUSBPort.close();
    }
    
    
    // write data to the serial port
    async writeToSerial(str) {
        if (this.connectedUSBPort) {
            const arr = new TextEncoder().encode(str);
            const writer = this.connectedUSBPort.writable.getWriter();
            await writer.write(arr);
    
            // Allow the serial port to be closed later.
            writer.releaseLock();
        }
    }

    // abstraction to write over whichever UART port is active (bluetooth or USB)
    writeString(str) {
        if (this.connectedUSBPort) {
            this.writeToSerial(str);
        }

        if (this.uBitBTDevice && this.rxCharacteristic) {
            try {
                let encoder = new TextEncoder();
                this.rxCharacteristic.writeValue(encoder.encode(str));
            } catch (error) {
                console.log(error);
            }
        }
    }

    writeLine(str) {
        this.writeString(`${str}\n`);
    }

}


