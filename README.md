# DES221 2024

A collection of web components for communicating between microprocessors (like the microbit) and software.

## Basic Usage
Open ```index.html``` using **Google Chrome**.
By default the page has three preloaded web components

- Serial Component: allows communication to and from a microprocessor like a **Micro:bit** or **Arduino** connected by USB, using the serial protocol.
- MIDI Component: allows triggering of MIDI messages from  messages received from the microprocessor
- Graphics Component: example of passing messages from the microprocessor to a graphics program. This is a port of the popular shadertoy site.

**Note that these tools only work in Google Chrome**. The tools use Web APIs such as WebSerial, WebMIDI etc. to work, and not all browsers implement these APIs.

## Serial Component
The Serial Compoment allows communication to and from a microprocessor like a **Micro:bit** or **Arduino** connected by USB, using the serial protocol. To use the Serial Component include these lines in your html document:
```html
<script src="components/SerialComponent/SerialComponent.js"></script>
<custom-serial></custom-serial>
```
Expand or collapse the component by clicking on the +/- button

If the microprocessor is plugged into your computer via USB, you should be able to connect to it by pressing the 'USB' button. NOTE: you will need to disconnect the microprocessor from any other page first. For example if you have connected a Micro:bit to the MakeCode editor you will need to disconnect it first.

Alternatively, you may be able to connect via Bluetooth by pressing the 'Bluetooth' button. For this to work you will need to have already paired the microprocessor with your computer using the system bluetooth settings. This seems to work more reliably on Windows than on Macintosh.

Once you are connected, serial messages should appear in the textbox in the far right of the component. This component separates the stream of serial data into messages delimited by newline characters, so make sure the microprocessor sends a newline "\n" character between commands. This character has hex value 0x0A (or decimal value 10). This is what you will get for example from a microbit with ```serial.writeLine("")```.

You can filter out particular types of messages using the buttons directly to the left of the message printout textbox. You will only receive messages starting with "MIDI" or "Graphics" if the corresponding button is toggled on (when it is toggled on it is green, and when it is toggled off it is red). If the "Other" button is toggled-on then any message not starting with "MIDI" or "Graphics" will be let through.

The "Send" button allows you to communicate data back to the microprocessor. It will send whatever string is in the textbox next to it, followed by a newline character "\n"

In order to create your own handler for messages, you need to define the method ```customHandler```. So, for example, in your index.js you could do something like
```javascript
const theSerialComponent = document.querySelector('custom-serial');
if (theSerialComponent) {
  theSerialComponent.customHandler = function(message) {
    // do whatever you want with the 'message'
    console.log(message);  
  }
}
```

## MIDI Component
The MIDI Component allows triggering of MIDI messages from  messages received from the microprocessor. To use the MIDI Component include these lines in your html document:
```html
<script src="components/MIDIComponent/MIDIComponent.js"></script>
<custom-midi></custom-midi>
```
Expand or collapse the component by clicking on the +/- button

This should show all of the available MIDI inputs and outputs the computer has enabled. 

The Serial Component converts the following messages
- MIDI NoteOn *pitch* *velocity* *channel*
- MIDI NoteOff *pitch* *velocity* *channel*
- MIDI ControlChange *controller* *value* *channel*

into the corresponding actual MIDI message to send via the MIDI Component. Note that *pitch*, *velocity*, *controller*, *value*, and *channel* above should be replaced with numbers between 0 and 127 (or 0 and 15 for channel). Read all about the MIDI message spec here: https://www.cs.cmu.edu/~music/cmsip/readings/MIDI%20tutorial%20for%20programmers.html


If you are working on a Mac computer, there is a built in virtual MIDI device called the IAC Driver (which stands for Inter-Application-Communication).  If this is enabled, it allows sending MIDI directly between software programs on your computer, without needing any hardware MIDI devices. So for example, we can send MIDI messages from the Serial Component to a software audio program like Ableton Live or Reaper. You can enable the IAC Driver by opening the program "Audio MIDI Setup" which is included with every mac (search for it with spotlight - it should be in /Applications/Utilities). In the main menu select Window | Show MIDI Studio. Double click on the IAC Driver icon, and then select the checkbox "Device is online".

If you are working on a Windows computer, you will need a separate utility program for virtually routing MIDI between software applications. For example loopMIDI http://www.tobias-erichsen.de/software/loopmidi.html. For Windows 11 try LoopBe1 https://www.nerds.de/en/loopbe1.html.

There is a mechanism for filtering out particular MIDI messages. If you click on the +/- button next to the words "Restrict to messages starting with " then a list of MIDI messages that have been received from the serial port popup.  You can Allow/Disallow particular kinds of messages. This is most helpful for mapping MIDI in software that has a MIDI learn functionality, where you need to be able to 'move' just one controller at a time.

## Graphics Component
The graphics component is a simple example of passing messages from the microprocessor to a graphics program. This is a port of the popular shadertoy site. The Serial Component converts the messages
- Graphics Roll *x*
- Graphics Pitch *y*

into mouseX and mouseY events for the graphics canvas. Here *x* and *y* are numbers representing the roll or pitch of a tilt sensor, measured in degrees from -180 to 180. In both cases 0 degrees corresponds to a mouse coordinate in the center of the canvas, and +/-180 degrees is the far right/left or top/bottom of the canvas.

It also converts the messages
- Graphics Knob 0 *x*
- Graphics Knob 1 *y*

into mouseX and mouseY events respectively (mapping 0-1023 to the full extent of the screen in either direction). Currently it ignores Graphics Knob messages with a knob number greater than 1.

The canvas itself plays back graphics programs created for shadertoy https://www.shadertoy.com.

To use it, find a shadertoy patch that you like, by browing their examples. For the moment only the simpler style of shadertoy patches work, that don't use any image assets, or multiple buffers etc. This means that the shadertoy patch will only have the "image" tab with source code in it, not any extra tabs like "common" or "buffer". Also the iChannel boxes down the bottom should be empty (these are for image assets). Also, not all shadertoy patches actually use the mouse input. Since the point of this graphics component is to demonstrate using data from a micro:bit (such as tilt data) to affect the graphics (by emulating mouse data), you might as well choose a patch that responds to the mouse. Otherwise you could just embed shadertoy itself into your webpage and not bother with this component. An example patch that works is the one this component uses by default, which is https://www.shadertoy.com/view/3l23Rh "Protean Clouds".

## Customising into your own page
The idea of this repository is to provide a template that can be customised into an interface for communicating to and from the microprocessor. To create your own web page, just edit the index.html file, by putting the html code for your interface where it says 
```html
<!-- add your html interface here -->
```
and putting any event handlers etc. in the index.js file where it says
```js
// put any javascript you need for your interface here
```

You can include or exclude any of the three included components as you like, and you can style the page however you like by editing style.css, and also the component style sheets for example components/SerialComponent/SerialComponent.css

*Advanced: You can override the default behaviour of handleMIDI and handleGraphics by redefining them in your client application. Just obtain a reference to the custom-serial element, and redefine these functions on this object.*
