# MMM-Pir

After a configured time without any user interaction the display will turn off and hide all modules for economy mode.<br>
It will wake up with a Pir sensor, Touch screen or crontab

## Screenshot

![](https://raw.githubusercontent.com/bugsounet/MMM-Pir/dev/screenshot/screenshot.png)

![](https://raw.githubusercontent.com/bugsounet/MMM-Pir/dev/screenshot/screenshot2.png)

## Installation

**Minimal node version requirement: v20**

Clone the module into your MagicMirror module folder and execute `npm run setup` in the module's directory.
```sh
cd ~/MagicMirror/modules
git clone https://github.com/bugsounet/MMM-Pir
cd MMM-Pir
npm run setup
```

This module will verify if all screen saver is disabled and disable it if needed

## Configuration
To display the module insert it in the config.js file.

### Personalized configuration

```js
{
  module: 'MMM-Pir',
  position: 'top_left',
  configDeepMerge: true,
  config: {
    debug: false,
    Display: {
      timeout: 2 * 60 * 1000,
      animate: true,
      style: 1,
      colorFrom: "#FF0000",
      colorTo: "#00FF00",
      mode: 1,
      counter: true,
      lastPresence: true,
      lastPresenceTimeFormat: "LL H:mm",
      availability: true,
      autoDimmer: false,
      xrandrForceRotation: "normal",
      wrandrForceRotation: "normal",
      wrandrForceMode: null,
      wrandrDisplayName: "wayland-0"
    },
    Pir: {
      mode: 0,
      gpio: 21
    },
    Cron: {
      ON: [],
      OFF: []
    },
    Touch: {
      mode: 3
    },
    Governor: {
      sleeping: 4,
      working: 2
    },
    Sounds: {
      on: "open.mp3",
      off: "close.mp3"
    }
  }
},
```

### Detailed Configuration
#### Root Configuration
 | Option  | Description | Type | Default |
 | ------- | --- | --- | --- |
 | debug | enable or not debug mode | Boolean | false |

------
#### Display Configuration
 | Option  | Description | Type | Default |
 | ------- | --- | --- | --- |
 | timeout | Time before the mirror turns off the display if no user activity is detected. (in ms) | Number | 120000 |
 | animate | Animate all modules on turn on/off your screen | Boolean | true |
 | style| Style of the Count-down. (see bellow) | String | Text |
 | colorFrom | Color of the start of the color gradient (default: Red in HEXA) | String | #FF0000 |
 | colorTo | Color of the start of the color gradient (default: Green in HEXA) | String | #00FF00 |
 | mode | mode for turn on/off your screen (see bellow) | number | 1 |
 | counter | Should display Count-down in screen ? | Boolean | true |
 | lastPresence| Display the date of the last user presence | Boolean | true |
 | lastPresenceTimeFormat| Change the date format (moment.js format) of the last presence | String | LL H:mm |
 | availability | Display screen availability time | Boolean | true |
 | autoDimmer | creen dimmer when timeout is 1/4 time left and use opacity from 100% to 0% | Boolean | false |
 | xrandrForceRotation | **-mode 2 only-** Forces screen rotation according to the defined value (possible value: "normal", "left", "right", "inverted") | String | normal |
 | wrandrForceRotation | **-mode 3 only-** Forces screen rotation according to the defined value (possible value: "normal", "90", "180", "270", "flipped", "flipped-90", "flipped-180", "flipped-270") | String | normal |
 | wrandrForceMode | **-mode 3 only-** Force screen resolution mode | String | null |
 | wrandrDisplayName | **-mode 3 only-** wayland display name (generaly `wayland-0` or `wayland-1`) | String | wayland-0 |

 * Available style:
   - `style: 0` - Don't display Count-up bar in screen
   - `style: 1` - Display count-up in text mode
   - `style: 2` - Display count-up with `Line` style
   - `style: 3` - Display count-up with `SemiCircle` style
   - `style: 4` - Display count-up with `Circle` style

 * Available mode:
   - `mode: 0` - disabled mode
   - `mode: 1` - use dpms (For raspbian 10/11 or raspbian 12 with x11 compositor)
   - `mode: 2` - use xrandr (For raspbian 11 or raspbian 12 with x11 compositor)
   - `mode: 3` - use wlr-randr (For rapsbian 12 with wayland compositor)
   - `mode: 4` - use HDMI CEC
   - `mode: 5` - use ddcutil (not yet documented)
   - `mode: 6` - use dpms (linux version for debian, ubuntu, ...)

------
#### Pir Configuration
 | Option  | Description | Type | Default |
 | ------- | --- | --- | --- |
 | mode | Detection mode (see bellow) | Number | 0 |
 | gpio | BCM-number of the sensor pin. | Number | 21 |

* Available mode:
    - `mode: 0` - use node-libgpiod library
    - `mode: 1` - use python script with gpiozero library

 ⚠ You can disable PIR Sensor detection by using `gpio: 0`

------
#### Cron Configuration
This is the rule to turn your screen on and off based on a set time event

Each event have an object format:
```js
{
  dayOfWeek: <Array of days>,
  hour: <hour>,
  minute: <minute>
}
```

`dayOfWeek` is an array of number
This number define the day:
  - `0`: Sunday
  - `1`: Monday
  - `2`: Tuesday
  - `3`: Wednesday
  - `4`: Thursday
  - `5`: Friday
  - `6`: Saturday

##### Sample
sample if you want to create an event from Monday to Thursday at 07h45:

```js
{
  dayOfWeek: [1,2,3,4],
  hour: 7,
  minute: 45
}
```

sample if you want to create an event every Friday at 08h00

```js
{
  dayOfWeek: [5],
  hour: 8,
  minute: 0
}
```

sample if you want to create an event from Monday to Friday at 17h00
```js
{
  dayOfWeek: [1,2,3,4,5],
  hour: 17,
  minute: 0
}
```

##### Create ON/OFF events

Let's create ON and OFF now
I want to apply this rules:

---> Screen is ON:
 * from Monday to Thursday at 07h45
 * every Friday at 08h00

So, `ON` rules will be:

```js
ON: [
  {
    dayOfWeek: [1,2,3,4],
    hour: 07,
    minute: 45
  },
  {
    dayOfWeek: [5],
    hour: 08,
    minute: 00
  }
],
```

---> Screen is OFF
  * from Monday to Friday at 17h00

So, `OFF` rules will be:

```js
OFF: [
  {
    dayOfWeek: [1,2,3,4,5],
    hour: 17,
    minute: 00
  }
]
```

Let's apply your own rules !

##### Notes
  * When `ON` event started: counter will be not displayed
  * When `OFF` event started: counter will be functional and turn off the screen when done
  * Don't be stupid! Don't create an ON event equal to OFF event

------
#### Touch Configuration
 | Option  | Description | Type | Default |
 | ------- | --- | --- | --- |
 | mode | Selected mode for enable/disable the screen with touch (see below) | Number | 3 |

* Available mode:
    - `touchMode: 0`
      - Touch mode is disabled
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

  * Notes:
    - If you lock your screen with TouchScreen, PIR sensor will be disabled
    - You need to unlock your screen with touchscreen to reactivate the PIR sensor

------
#### Governor Configuration

CPU governor enables the operating system to scale the CPU frequency up or down in order to save power or improve performance.

On each boot of your RPI, your governor is set automaticaly to `ondemand`.

This configuration allows to change it dynamicaly

 | Option  | Description | Type | Default |
 | ------- | --- | --- | --- |
 | sleeping | Governor number mode when your screen is turned off | Number | 4 |
 | working | Governor number mode when your screen is turned on | Number | 2 |

* Available `sleeping` and `working` mode:
  - `0`: Disable any governor mode change
  - `1`: Apply `conservative` governor mode
  - `2`: Apply `ondemand` governor mode
  - `3`: Apply `userspace` governor mode
  - `4`: Apply `powersave` governor mode
  - `5`: Apply `performance` governor mode


If you want a maximum of CPU power, `performance` is the best choice !

If you want an economy mode of CPU power, `powersave` is the best choice !

------
#### Sounds Configuration

Sounds configuration will play audio file when your screen turn on or off.

 | Option  | Description | Type | Default |
 | ------- | --- | --- | --- |
 | on | File to play when screen turn on | String or 0 | open.mp3 |
 | off | File to play when screen turn off | String or 0 | close.mp3 |
 
You can personalize your sound, just past your file into `sounds` folder and report filename (with extension) in your configuration

You can disable sound by using `0` in your configuration

------
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
For reinstall this module or when an update of MagicMirror² is available, you can use this command:
```sh
cd ~/MagicMirror/modules/MMM-Pir
npm run rebuild
```

## Notes
 * `mode 1` works with bullseye OS (raspbian 11)<br>
 ↪️ Just use `dtoverlay=vc4-fkms-v3d` driver in `/boot/config.txt`

## Support
 * Get assistance on [bugsounet website](https://www.bugsounet.fr)
