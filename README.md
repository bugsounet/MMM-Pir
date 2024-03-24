# MMM-Pir

After a configured time without any user interaction the display will turn off and hide all modules for economy mode.<br>
It will wake up with a Pir sensor

## Screenshot

![](https://raw.githubusercontent.com/bugsounet/MMM-Pir/dev/screenshot/screenshot.png)

![](https://raw.githubusercontent.com/bugsounet/MMM-Pir/dev/screenshot/screenshot2.png)

## Installation

**Minimal node version requirement: v18**

Clone the module into your MagicMirror module folder and execute `npm install` in the module's directory.
```sh
cd ~/MagicMirror/modules
git clone https://github.com/bugsounet/MMM-Pir
cd MMM-Pir
npm install
```

This module will verify if all screen saver is disabled and disable it if needed

## Configuration
To display the module insert it in the config.js file.

### Personalized configuration

```js
{
  module: 'MMM-Pir',
  position: 'top_left',
  config: {
    debug: false,
    delay: 2 * 60 * 1000,
    mode: 1,
    displayCounter: true,
    displayBar: true,
    displayStyle: "Text",
    displayLastPresence: true,
    lastPresenceTimeFormat: "LL H:mm",
    mode6_gpio: 20,
    mode6_clearGpioValue: true,
    xrandrForceRotation: "normal",
    wrandrForceRotation: "normal",
    wrandrForceMode: "1920x1080",
    touchMode: 3,
    pir_gpio: 21,
    pir_mode: 0,
  }
},
```

### Detailed Configuration

 | Option  | Description | Type | Default |
 | ------- | --- | --- | --- |
 | debug | enable or not debug mode | Boolean | false |
 | delay | Time before the mirror turns off the display if no user activity is detected. (in ms) | Number | 120000 |
 | mode | mode for turn on/off your screen (see bellow) | number | 1 |
 | displayCounter | Should display Count-down in screen ? | Boolean | true |
 | displayBar| Should display Count-up bar in screen ? | Boolean | true |
 | displayStyle| Style of the Count-down. Available: "Text", "Line", "SemiCircle", "Circle" | String | Text |
 | displayLastPresence| Display the date of the last user presence | Boolean | true |
 | lastPresenceTimeFormat| Change the date format (moment.js format) of the last presence | String | LL H:mm |
 | mode6_gpio| **-mode 6 only-** GPIO number for control the relay (switch) | Number | 20 |
 | mode6_clearGpioValue| **-mode 6 only-** reset GPIO value script of relay (switch) | Boolean | true |
 | xrandrForceRotation | **-mode 9 only-** Forces screen rotation according to the defined value (possible value: "normal", "left", "right", "inverted") | String | normal |
 | wrandrForceRotation | **-mode 10 only-** Forces screen rotation according to the defined value (possible value: "normal", "90", "180", "270", "flipped", "flipped-90", "flipped-180", "flipped-270") | String | normal |
 | wrandrForceMode | **-mode 10 only-** Force screen resolution mode | String | null |
 | touchMode | Selected mode for enable/disable the screen with touch (see below) | Number | 3 |
 | pir_gpio | BCM-number of the sensor pin. Use `0`, if you want to disable PIR Sensor detection | Number | 21 |
 | pir_mode | Detection mode (see bellow) | Number | 0 |

 * Available mode:
   - `mode: 1` - use vgencmd (For raspbian 10/11)
   - `mode: 2` - use dpms (For raspbian 10/11 or raspbian 12 with x11 compositor)
   - `mode: 3` - use tvservice (For raspbian 10/11)
   - `mode: 4` - use HDMI CEC
   - `mode: 5` - use dpms (linux version for debian, ubuntu, ...)
   - `mode: 6` - use a relay switch command controled by GPIO with python
   - `mode: 7` - use a relay switch command controled by GPIO with python (read reverse values)
   - `mode: 8` - use ddcutil (not yet documented)
   - `mode: 9` - use xrandr use xrandr (For raspbian 11 or raspbian 12 with x11 compositor)
   - `mode: 10` - use wlr-randr (For rapsbian 12 with wayland compositor)
   - `mode: 0` - disabled mode

  * Available touchMode:
   - `touchMode: 0`
     - disabled
   - `touchMode: 1`
     - One click on the screen will restart the timer (or Wake up the screen if needed)
     - Double Click on the screen will shutdown the screen
   - `touchMode: 2`
     - One Click on the MMM-Pir area will restart the timer
     - Long Click on the screen will shutdown or wake up the screen (toogle)
   - `touchMode: 3`
     - One Click on the MMM-Pir area will restart the timer
     - Doucle Click on the MMM-Pir area will shutdown the screen
     - One Click on the screen will wake up if shutdown

  * Available pir_mode:
    - `pir_mode: 0` - use `onoff` library (For Raspberry Pi 3b+ and 4)
    - `pir_mode: 1` - use python script with RPI.GPIO library (For Raspberry Pi 3b+ and 4)
    - `pir_mode: 2` - use python script with gpiozero library (For Raspberry Pi 5, not tested on other Raspberry Pi)

  Notes: 
    * If you lock your screen with TouchScreen, PIR sensor will be disabled
    * You need to unlock your screen with touchscreen to reactivate the PIR sensor

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

### Manual update

In a terminal try this command:
```sh
cd ~/MagicMirror/modules/MMM-Pir
npm run update
```

### Automatic Update from [updatenotification](https://develop.docs.magicmirror.builders/modules/updatenotification.html) default module

Since MagicMirror² v2.27.x, we are able to Update automaticaly any modules from `updatenotification`.<br>
Let's add `MMM-Pir` rule

```js
  {
    module: "updatenotification",
    position: "top_center",
    config: {
      updateAutorestart: true, // restart MagicMirror automaticaly after update
      updates: [
        // MMM-Pir rule
        {
          "MMM-Pir": "npm run update"
        },
      ]
    }
  },
```
## Reinstall
For reinstall this module or when an update of MagicMirror is available, you can use this command:
```sh
cd ~/MagicMirror/modules/MMM-Pir
npm run rebuild
```

## Notes: 
 `mode 1` works with bullseye OS (raspbian 11)<br>
 Just use `dtoverlay=vc4-fkms-v3d` driver in `/boot/config.txt`
