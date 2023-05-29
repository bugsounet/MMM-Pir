# MMM-Pir

After a configurated time without any user interaction the display will turn off and hide all modules for economy mode.<br>
It will wake up with a Pir sensor

## Screenshot

![](https://raw.githubusercontent.com/bugsounet/MMM-Pir/dev/screenshot/screenshot.png)

![](https://raw.githubusercontent.com/bugsounet/MMM-Pir/dev/screenshot/screenshot2.png)

## Installation

Clone the module into your MagicMirror module folder and execute `npm intall` in the module's directory.
```
cd ~/MagicMirror/modules
git clone https://github.com/bugsounet/MMM-Pir
cd EXT-Screen
npm install
```

This module will verify if all screen saver is disabled and disable it if needed

## Configuration
To display the module insert it in the config.js file.

### Personalized configuration

```js
{
  module: 'EXT-Screen',
  position: 'top_left',
  config: {
    debug: false,
    delay: 2 * 60 * 1000,
    turnOffDisplay: true,
    mode: 1,
    ecoMode: true,
    displayCounter: true,
    displayBar: true,
    displayStyle: "Text",
    displayLastPresence: true,
    lastPresenceTimeFormat: "LL H:mm",
    mode6_gpio: 20,
    mode6_clearGpioValue: true,
    pir_gpio: 21,
    pir_reverseValue: false
  }
},
```

### Detailed Configuration

 | Option  | Description | Type | Default |
 | ------- | --- | --- | --- |
 | debuf | enable or not debug mode | Boolean | false |
 | delay | Time before the mirror turns off the display if no user activity is detected. (in ms) | Number | 120000 |
 | turnOffDisplay | Should the display turn off after timeout? | Boolean | true |
 | mode | mode for turn on/off your screen (see bellow) | number | 1 |
 | ecoMode | Should the MagicMirror hide all module after timeout ? | Boolean | true |
 | displayCounter | Should display Count-down in screen ? | Boolean | true |
 | displayBar| Should display Count-up bar in screen ? | Boolean | true |
 | displayStyle| Style of the Count-down. Available: "Text", "Line", "SemiCircle", "Circle", "Bar" | String | Text |
 | displayLastPresence| Display the date of the last user presence | Boolean | true |
 | lastPresenceTimeFormat| Change the date format (moment.js format) of the last presence | String | LL H:mm |
 | mode6_gpio| GPIO number for control the relay (mode 6 only) | Number | 20 |
 | mode6_clearGpioValue| reset GPIO value script of relay (mode 6 only) | Boolean | true |
 | pir_gpio | BCM-number of the sensor pin | Number | 21 |
 | pir_reverseValue | Reverse sensor received value | Boolean | false |

 * Available mode:
   - `mode: 1` - use vgencmd (RPI only)
   - `mode: 2` - use dpms (version RPI)
   - `mode: 3` - use tvservice (RPI only)
   - `mode: 4` - use HDMI CEC
   - `mode: 5` - use dpms (linux version for debian, ubuntu, ...)
   - `mode: 6` - use a relay switch command controled by GPIO with python
   - `mode: 7` - use a relay switch command controled by GPIO with python (read reverse values)
   - `mode: 8` - use ddcutil (not yet documented)
   - `mode: 0` - disabled mode and disable turnOffDisplay too

## Developer Notes

- This module broadcasts:

  * `USER_PRESENCE` with payload `true` when your screen turn on.
  * `USER_PRESENCE` with payload `false` when your screen turn off.

- This module receive:

  * `MMM_PIR-END` notification to force the end of the count down
  * `MMM_PIR-WAKEUP` notification to wake up the screen and reset count down
  * `MMM_PIR-LOCK` notification keep the screen on and lock it (freeze counter and stop pir detection) 
  * `MMM_PIR-UNLOCK` notification unlock the screen and restart counter and pir detection
  * `USER_PRESENCE` with payload `true` or `false` like `MMM_PIR-WAKEUP` or `MMM_PIR-END` notification

## Update
```sh
cd ~/MagicMirror/modules/MMM-Pir
npm run update
```

## Reinstall
For reinstall this module or when an update of MagicMirror is available, you can use this command:

```
cd ~/MagicMirror/modules/MMM-Pir
npm run rebuild
```
 ## Notes: 
 `mode 1` works with bullseye OS !<br>
 Just use `dtoverlay=vc4-fkms-v3d` driver in `/boot/config.txt`
