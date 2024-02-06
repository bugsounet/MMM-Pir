/*!******************
* Screen management *
* Bugsounet         *
*********************/

const exec = require('child_process').exec
const process = require('process')
const moment = require('moment')
const path = require('path')
var log = (...args) => { /* do nothing */ }

class SCREEN {
  constructor(config, callback) {
    this.config = config
    this.sendSocketNotification = callback
    if (this.config.debug) log = (...args) => { console.log("[MMM-Pir] [LIB] [SCREEN]", ...args) }
    this.PathScript = path.dirname(require.resolve('../package.json'))+"/scripts"
    this.interval = null
    this.default = {
      delay: 5 * 60 * 1000,
      displayCounter: true,
      displayBar: false,
      mode: 1,
      gpio: 20,
      clearGpioValue: true,
      xrandrForceRotation: "normal",
      wrandrForceRotation: "normal",
      wrandrForceMode: null
    }
    this.config = Object.assign(this.default, this.config)
    this.screen = {
      mode: this.config.mode,
      running: false,
      locked: false,
      power: false,
      xrandrRotation: null,
      wrandrRotation: null,
      wrandrForceMode: null,
      hdmiPort: null,
      forceOnStart: true,
      forceLocked: false
    }

    this.status = false
    this.xrandrRoation = [ "normal", "left", "right", "inverted" ]
    this.wrandrRoation = [ "normal", "90", "180", "270", "flipped", "flipped-90", "flipped-180", "flipped-270" ]

    switch (this.config.mode) {
      case 0:
        console.log("[MMM-Pir] [LIB] [SCREEN] Mode 0: Disabled")
        break
      case 1:
        console.log("[MMM-Pir] [LIB] [SCREEN] Mode 1: vcgencmd")
        break
      case 2:
        console.log("[MMM-Pir] [LIB] [SCREEN] Mode 2: dpms rpi")
        break
      case 3:
        console.log("[MMM-Pir] [LIB] [SCREEN] Mode 3: tvservice")
        break
      case 4:
        console.log("[MMM-Pir] [LIB] [SCREEN] Mode 4: HDMI CEC")
        break
      case 5:
        console.log("[MMM-Pir] [LIB] [SCREEN] Mode 5: dpms linux")
        break
      case 6:
        console.log("[MMM-Pir] [LIB] [SCREEN] Mode 6: Python script (Relay on/off)")
        break
      case 7:
        console.log("[MMM-Pir] [LIB] [SCREEN] Mode 7: Python script reverse (Relay on/off)")
        break
      case 8:
        console.log("[MMM-Pir] [LIB] [SCREEN] Mode 8: ddcutil")
        break
      case 9:
        if (this.xrandrRoation.indexOf(this.config.xrandrForceRotation) == -1) {
        console.error(`[MMM-Pir] [LIB] [SCREEN] Mode 9: xrandr invalid Rotation --> ${this.config.xrandrForceRotation}, Set to default: normal`)
        this.screen.xrandrRotation = "normal"
        } else {
        console.log(`[MMM-Pir] [LIB] [SCREEN] Mode 9: xrandr (primary display) -- Rotation: ${this.config.xrandrForceRotation}`)
        this.screen.xrandrRotation = this.config.xrandrForceRotation
        }
        break
      case 10:
        if (this.wrandrRoation.indexOf(this.config.wrandrForceRotation) == -1) {
        console.error(`[MMM-Pir] [LIB] [SCREEN] Mode 10: wlr-randr invalid Rotation --> ${this.config.wrandrForceRotation}, Set to default: normal`)
        this.screen.wrandrRotation = "normal"
        } else {
        console.log(`[MMM-Pir] [LIB] [SCREEN] Mode 10: wlr-randr (primary display) -- Rotation: ${this.config.wrandrForceRotation}`)
        this.screen.wrandrRotation = this.config.wrandrForceRotation
        }
        if (this.config.wrandrForceMode) {
        console.log(`[MMM-Pir] [LIB] [SCREEN] Mode 10: wlr-randr -- ForceMode: ${this.config.wrandrForceMode}`)
        this.screen.wrandrForceMode = this.config.wrandrForceMode
        }
        break
      default:
        this.logError(`Unknow Mode (${this.config.mode}) Set to 0 (Disabled)`)
        this.sendSocketNotification("ERROR", `[MMM-Pir] Unknow Mode (${this.config.mode}) Set to 0 (Disabled)`)
        this.config.mode = 0
        break
    }
    this.screenStatus()
  }

  activate () {
    process.on('exit', (code) => {
      if (this.config.mode) this.setPowerDisplay(true)
      console.log('[MMM-Pir] [LIB] [SCREEN] See you soon !')
      console.log('[MMM-Pir] [LIB] [SCREEN] @bugsounet')
    })
    this.start()
  }

  start (restart) {
    if (this.screen.locked || this.screen.running) return
    if (!restart) log("Start.")
    else log("Restart.")
    this.sendSocketNotification("SCREEN_PRESENCE", true)
    if (!this.screen.power) {
      if (this.config.mode) this.wantedPowerDisplay(true)
      this.sendSocketNotification("SCREEN_SHOWING")
      this.screen.power = true
    }
    clearInterval(this.interval)
    this.interval = null
    this.counter = this.config.delay
    this.interval = setInterval( ()=> {
      this.screen.running = true
      let output = {
        timer: moment(new Date(this.counter)).format("mm:ss"),
        bar: this.config.delay - this.counter
      }
      this.sendSocketNotification("SCREEN_OUTPUT", output)
      if (this.counter <= 0) {
        clearInterval(this.interval)
        this.interval = null
        this.screen.running = false
        this.forceTurnOffScreen()
        log("Stops by counter.")
      }
      this.counter -= 1000
    }, 1000)
  }

  forceTurnOffScreen() {
    if (!this.screen.power) return log("forceTurnOffScreen: already off")
    this.sendSocketNotification("SCREEN_HIDING")
    this.screen.power = false
    if (this.config.mode) this.wantedPowerDisplay(false)
    this.sendSocketNotification("SCREEN_PRESENCE", false)
  }

  stop () {
    if (this.screen.locked) return

    if (!this.screen.power) {
      if (this.config.mode) this.wantedPowerDisplay(true)
      this.sendSocketNotification("SCREEN_SHOWING")
      this.screen.power = true
    }
    this.sendSocketNotification("SCREEN_PRESENCE", true)
    if (!this.screen.running) return
    clearInterval(this.interval)
    this.interval = null
    this.screen.running = false
    log("Stops.")
  }

  reset() {
    if (this.screen.locked) return
    clearInterval(this.interval)
    this.interval = null
    this.screen.running = false
    this.start(true)
  }

  wakeup() {
    if (this.screen.locked) return
    this.reset()
  }

  lock() {
    if (this.screen.locked) return
    this.screen.locked = true
    clearInterval(this.interval)
    this.interval = null
    this.screen.running = false
    log("Locked !")
  }

  unlock() {
    if (this.screen.forceLocked) return log("Unlock: ForceLocked")
    this.screen.locked = false
    log("Unlocked !")
    this.start()
  }

  forceEnd () {
    clearInterval(this.interval)
    this.interval = null
    this.screen.running = false
    this.counter = 0
    this.forceTurnOffScreen()
  }

  wantedPowerDisplay (wanted) {
    var actual = false
    switch (this.config.mode) {
      case 0:
      /** disabled **/
        log("Disabled mode")
        break
      case 1:
      /** vcgencmd **/
        exec("/usr/bin/vcgencmd display_power", (err, stdout, stderr)=> {
          if (err) {
            this.logError(err)
            this.sendSocketNotification("ERROR", `[SCREEN] vcgencmd command error (mode: ${this.config.mode})`)
          }
          else {
            var displaySh = stdout.trim()
            actual = Boolean(Number(displaySh.substr(displaySh.length -1)))
            this.resultDisplay(actual,wanted)
          }
        })
        break
      case 2:
      /** dpms rpi**/
        var actual = false
        exec("DISPLAY=:0 xset q | grep Monitor", (err, stdout, stderr)=> {
          if (err) {
            this.logError(err)
            this.sendSocketNotification("ERROR", `[SCREEN] dpms command error (mode: ${this.config.mode})`)
          }
          else {
            let responseSh = stdout.trim()
            var displaySh = responseSh.split(" ")[2]
            if (displaySh == "On") actual = true
            this.resultDisplay(actual,wanted)
          }
        })
        break
      case 3:
      /** tvservice **/
        exec("tvservice -s | grep Hz", (err, stdout, stderr)=> {
          if (err) {
            this.logError(err)
            this.sendSocketNotification("ERROR", `[SCREEN] tvservice command error (mode: ${this.config.mode})`)
          }
          else {
            let responseSh = stdout.trim()
            if (responseSh) actual = true
            this.resultDisplay(actual,wanted)
          }
        })
        break
      case 4:
      /** CEC **/
        exec("echo 'pow 0' | cec-client -s -d 1", (err, stdout, stderr)=> {
          if (err) {
            this.logError(err)
            this.logError("HDMI CEC Error: " + stdout)
            this.sendSocketNotification("ERROR", `[SCREEN] HDMI CEC command error (mode: ${this.config.mode})`)
          } else {
            let responseSh = stdout.trim()
            var displaySh = responseSh.split("\n")[1].split(" ")[2]
            if (displaySh == "on") actual = true
            if (displaySh == "unknown") log("HDMI CEC unknow state")
            this.resultDisplay(actual,wanted)
          }
        })
        break
      case 5:
      /** dmps linux **/
        exec("xset q | grep Monitor", (err, stdout, stderr)=> {
          if (err) {
            this.logError("[Display Error] " + err)
            this.sendSocketNotification("ERROR", `[SCREEN] dpms linux command error (mode: ${this.config.mode})`)
          }
          else {
            let responseSh = stdout.trim()
            var displaySh = responseSh.split(" ")[2]
            if (displaySh == "On") actual = true
            this.resultDisplay(actual,wanted)
          }
        })
        break
      case 6:
      /** python script **/
        exec(`python monitor.py -s -g=${this.config.gpio}`, { cwd: this.PathScript }, (err, stdout, stderr)=> {
          if (err) {
            this.logError("[Display Error] " + err)
            this.sendSocketNotification("ERROR", `[SCREEN] python relay script error (mode: ${this.config.mode})`)
          }
          else {
            let responsePy = stdout.trim()
            log("Response PY -- Check State: " + responsePy)
            if (responsePy == 1) actual = true
            this.resultDisplay(actual,wanted)
          }
        })
        break
      case 7:
      /** python script reverse**/
        exec(`python monitor.py -s -g=${this.config.gpio}`, { cwd: this.PathScript }, (err, stdout, stderr)=> {
          if (err) {
            this.logError("[Display Error] " + err)
            this.sendSocketNotification("ERROR", `[SCREEN] python relay script error (mode: ${this.config.mode})`)
          }
          else {
            let responsePy = stdout.trim()
            log(`Response PY -- Check State (reverse): ${responsePy}`)
            if (responsePy == 0) actual = true
            this.resultDisplay(actual,wanted)
          }
        })
        break
      case 8:
      /** ddcutil **/
        exec("ddcutil getvcp d6", (err, stdout, stderr)=> {
          if (err) {
            this.logError(err)
            this.sendSocketNotification("ERROR", `[SCREEN] ddcutil command error (mode: ${this.config.mode})`)
          }
          else {
            let responseSh = stdout.trim()
            var displaySh = responseSh.split("(sl=")[1]
            if (displaySh == "0x01)") actual = true
            this.resultDisplay(actual,wanted)
          }
        })
        break
      case 9:
      /** xrandr on primary display **/
        exec("xrandr | grep 'connected primary'",
            (err, stdout, stderr)=> {
                if (err) {
                    this.logError(err)
                    this.sendSocketNotification("ERROR", `[SCREEN] xrandr command error (mode: ${this.config.mode})`)
                }
                else {
                    let responseSh = stdout.trim()
                    var power = "on"
                    this.screen.hdmiPort = responseSh.split(" ")[0]
                    if (responseSh.split(" ")[3] == "(normal") power = "off"
                    if (power == "on") actual = true
                    log(`[MODE 9] Monitor on ${this.screen.hdmiPort} is ${power}`)
                    this.resultDisplay(actual,wanted)
                }
            }
        )
        break
      case 10:
      /** wl-randr on primary display **/
        exec("WAYLAND_DISPLAY=wayland-1 wlr-randr | grep 'Enabled'",
            (err, stdout, stderr)=> {
                if (err) {
                    this.logError(err)
                    this.sendSocketNotification("ERROR", `[SCREEN] wlr-randr command error (mode: ${this.config.mode})`)
                } else {
                  let responseSh = stdout.trim()
                  if (responseSh.split(" ")[1] == "yes") actual = true
                  exec("WAYLAND_DISPLAY=wayland-1 wlr-randr",
                    (err, stdout, stderr) => {
                      if (err) {
                        this.logError(err)
                        this.sendSocketNotification("ERROR", `[SCREEN] wlr-randr scan screen command error (mode: ${this.config.mode})`)
                      } else {
                        let wResponse = stdout.trim()
                        this.screen.hdmiPort = wResponse.split(" ")[0]
                        log(`[MODE 10] Monitor on ${this.screen.hdmiPort} is ${actual}`)
                        this.resultDisplay(actual,wanted)
                      }
                    })
                }
            }
        )
        break
    }
  }

  resultDisplay (actual,wanted) {
    if (this.screen.forceOnStart) {
      log("Display: Force On Start")
      this.setPowerDisplay(true)
      this.screen.forceOnStart = false
    } else {
      log("Display -- Actual: " + actual + " - Wanted: " + wanted)
      this.screen.power = actual
      if (actual && !wanted) this.setPowerDisplay(false)
      if (!actual && wanted) this.setPowerDisplay(true)
    }
  }

  setPowerDisplay (set) {
    log("Display " + (set ? "ON." : "OFF."))
    this.screen.power = set
    // and finally apply rules !
    switch (this.config.mode) {
      case 1:
        if (set) exec("/usr/bin/vcgencmd display_power 1")
        else exec("/usr/bin/vcgencmd display_power 0")
        break
      case 2:
        if (set) exec("DISPLAY=:0 xset dpms force on")
        else exec("DISPLAY=:0 xset dpms force off")
        break
      case 3:
        if (set) exec("tvservice -p && sudo chvt 6 && sudo chvt 7")
        else exec("tvservice -o")
        break
      case 4:
        if (set) exec("echo 'on 0' | cec-client -s")
        else exec("echo 'standby 0' | cec-client -s")
        break
      case 5:
        if (set) exec("xset dpms force on")
        else exec("xset dpms force off")
        break
      case 6:
        if (set)
          exec(`python monitor.py -r=1 -g=${this.config.gpio}`, { cwd: this.PathScript }, (err, stdout, stderr)=> {
            if (err) logError(err)
            else log("Relay is " + stdout.trim())
          })
        else
          if (this.config.clearGpioValue) {
            exec(`python monitor.py -r=0 -c -g=${this.config.gpio}`, {cwd: this.PathScript},(err, stdout, stderr)=> {
              if (err) logError(err)
              else {
                log("Relay is " + stdout.trim())
              }
            })
          } else {
            exec(`python monitor.py -r=0 -g=${this.config.gpio}`, {cwd: this.PathScript},(err, stdout, stderr)=> {
              if (err) logError(err)
              else {
                log("Relay is " + stdout.trim())
              }
            })
          }
        break
      case 7:
        if (set) {
          if (this.config.clearGpioValue) {
            exec(`python monitor.py -r=0 -c -g=${this.config.gpio}`, {cwd: this.PathScript},(err, stdout, stderr)=> {
              if (err) logError(err)
              else {
                log("Relay is " + stdout.trim())
              }
            })
          } else {
            exec(`python monitor.py -r=0 -g=${this.config.gpio}`, {cwd: this.PathScript},(err, stdout, stderr)=> {
              if (err) logError(err)
              else {
                log("Relay is " + stdout.trim())
              }
            })
          }
        } else {
          exec(`python monitor.py -r=1 -g=${this.config.gpio}`, { cwd: this.PathScript }, (err, stdout, stderr)=> {
            if (err) logError(err)
            else log("Relay is " + stdout.trim())
          })
        }
        break
      case 8:
        if (set) exec("ddcutil setvcp d6 1")
        else exec("ddcutil setvcp d6 4")
        break
      case 9:
        if (set) exec(`xrandr --output ${this.screen.hdmiPort} --auto --rotate ${this.screen.xrandrRotation}`)
        else exec(`xrandr --output ${this.screen.hdmiPort} --off`)
        break
      case 10:
        if (set) {
          let wrandrOptions = [
            "--output", this.screen.hdmiPort,
            "--on",
            "--transform", this.screen.wrandrRotation
          ]
          if (this.screen.wrandrForceMode) wrandrOptions.push("--mode", this.screen.wrandrForceMode)
          wrandrOptions = wrandrOptions.join(" ")
          exec(`WAYLAND_DISPLAY=wayland-1 wlr-randr ${wrandrOptions}`)
        }
        else exec(`WAYLAND_DISPLAY=wayland-1 wlr-randr --output ${this.screen.hdmiPort} --off`)
        break
    }
  }

  state() {
    this.sendSocketNotification("SCREEN_STATE", this.screen)
  }

  logError(err) {
    console.error("[MMM-Pir] [LIB] [SCREEN] " + err)
    this.sendSocketNotification("SCREEN_ERROR", err.message)
  }

  /** Force Lock ON/OFF display **/
  forceLockOFF() {
    if (!this.screen.power) return log("[Force OFF] Display Already OFF")
    this.sendForceLockState(true)
    this.screen.locked = true
    clearInterval(this.interval)
    this.interval = null
    if (this.screen.running) this.counter = 0
    this.screen.running = false
    this.forceTurnOffScreen()
    log("[Force OFF] Turn OFF Display")
  }

  forceLockON() {
    if (this.screen.locked && !this.screen.forceLocked) return log("[Force ON] Display is Locked!")
    this.sendForceLockState(false)
    this.screen.locked = false
    this.wakeup()
    log("[Force ON] Turn ON Display")
  }

  sendForceLockState(state) {
    this.screen.forceLocked = state
  }

  screenStatus() {
    setInterval(() => {
      let status = this.screen.power
      if (status !== this.status) {
        this.sendSocketNotification("SCREEN_POWERSTATUS", status)
        log("[POWER] Display from", this.status, "--->", status)
      }
      this.status = status
    }, 1000)
  }
}

module.exports = SCREEN
