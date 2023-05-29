/** Screen management **/
/** bugsounet **/

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
      turnOffDisplay: true,
      ecoMode: true,
      displayCounter: true,
      displayBar: false,
      mode: 1,
      gpio: 20,
      clearGpioValue: true
    }
    this.config = Object.assign(this.default, this.config)
    this.screen = {
      mode: this.config.mode,
      running: false,
      locked: false,
      power: false,
    }
    if (this.config.turnOffDisplay) {
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
        default:
          this.logError("Unknow Mode Set to 0 (Disabled)")
          this.sendSocketNotification("ERROR", "[MMM-Pir] Unknow Mode (" + this.config.mode + ") Set to 0 (Disabled)")
          this.config.mode = 0
          break
      }
    }
  }

  activate () {
    if (!this.config.turnOffDisplay && !this.config.ecoMode) return log("Disabled.")
    process.on('exit', (code) => {
      if (this.config.turnOffDisplay && this.config.mode) this.setPowerDisplay(true)
      console.log('[MMM-Pir] [LIB] [SCREEN] See you soon !')
      console.log('[MMM-Pir] [LIB] [SCREEN] @bugsounet')
    })
    this.start()
  }

  start (restart) {
    if (this.screen.locked || this.screen.running || (!this.config.turnOffDisplay && !this.config.ecoMode)) return
    if (!restart) log("Start.")
    else log("Restart.")
    this.sendSocketNotification("SCREEN_PRESENCE", true)
    if (!this.screen.power) {
      if (this.config.turnOffDisplay && this.config.mode) this.wantedPowerDisplay(true)
      if (this.config.ecoMode) {
        this.sendSocketNotification("SCREEN_SHOWING")
        this.screen.power = true
      }
    }
    clearInterval(this.interval)
    this.interval = null
    this.counter = this.config.delay
    this.interval = setInterval( ()=> {
      this.screen.running = true

      if (this.config.displayCounter) {
        this.sendSocketNotification("SCREEN_TIMER", moment(new Date(this.counter)).format("mm:ss"))
        if (this.config.dev) log("Counter:", moment(new Date(this.counter)).format("mm:ss"))
      }
      if (this.config.displayBar) {
        this.sendSocketNotification("SCREEN_BAR", this.config.delay - this.counter )
      }
      if (this.counter <= 0) {
        clearInterval(this.interval)
        this.screen.running = false
        if (this.screen.power) {
          if (this.config.ecoMode) {
            this.sendSocketNotification("SCREEN_HIDING")
            this.screen.power = false
          }
          if (this.config.turnOffDisplay && this.config.mode) this.wantedPowerDisplay(false)
        }
        this.interval = null
        this.sendSocketNotification("SCREEN_PRESENCE", false)
        log("Stops by counter.")
      }
      this.counter -= 1000
    }, 1000)
  }

  stop () {
    if (this.screen.locked) return

    if (!this.screen.power) {
      if (this.config.turnOffDisplay && this.config.mode) this.wantedPowerDisplay(true)
      if (this.config.ecoMode) {
        this.sendSocketNotification("SCREEN_SHOWING")
        this.screen.power = true
      }
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
    if (!this.screen.locked) return
    this.screen.locked = false
    log("Unlocked !")
    this.start()
  }

  forceEnd () {
    this.counter = 0
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
            this.sendSocketNotification("ERROR", "[SCREEN] vcgencmd command error (mode: " + this.config.mode + ")")
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
            this.sendSocketNotification("ERROR", "[SCREEN] dpms command error (mode: " + this.config.mode + ")")
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
            this.sendSocketNotification("ERROR", "[SCREEN] tvservice command error (mode: " + this.config.mode + ")")
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
            this.sendSocketNotification("ERROR", "[SCREEN] HDMI CEC command error (mode: " + this.config.mode + ")")
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
            this.sendSocketNotification("ERROR", "[SCREEN] dpms linux command error (mode: " + this.config.mode + ")")
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
        exec("python monitor.py -s -g="+this.config.gpio, { cwd: this.PathScript }, (err, stdout, stderr)=> {
          if (err) {
            this.logError("[Display Error] " + err)
            this.sendSocketNotification("ERROR", "[SCREEN] python relay script error (mode: " + this.config.mode + ")")
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
        exec("python monitor.py -s -g="+this.config.gpio, { cwd: this.PathScript }, (err, stdout, stderr)=> {
          if (err) {
            this.logError("[Display Error] " + err)
            this.sendSocketNotification("ERROR", "[SCREEN] python relay script error (mode: " + this.config.mode + ")")
          }
          else {
            let responsePy = stdout.trim()
            log("Response PY -- Check State (reverse): " + responsePy)
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
            this.sendSocketNotification("ERROR", "[SCREEN] ddcutil command error (mode: " + this.config.mode + ")")
          }
          else {
            let responseSh = stdout.trim()
            var displaySh = responseSh.split("(sl=")[1]
            log(responseSh)
            log(displaySh)
            if (displaySh == "0x01)") actual = true
            this.resultDisplay(actual,wanted)
          }
        })
        break
    }
  }

  resultDisplay (actual,wanted) {
    log("Display -- Actual: " + actual + " - Wanted: " + wanted)
    this.screen.power = actual
    if (actual && !wanted) this.setPowerDisplay(false)
    if (!actual && wanted) this.setPowerDisplay(true)
  }

  async setPowerDisplay (set) {
    log("Display " + (set ? "ON." : "OFF."))
    this.screen.power = set
    this.SendScreenPowerState()
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
          exec("python monitor.py -r=1 -g="+this.config.gpio, { cwd: this.PathScript }, (err, stdout, stderr)=> {
            if (err) logError(err)
            else log("Relay is " + stdout.trim())
          })
        else
          if (this.config.clearGpioValue) {
            exec("python monitor.py -r=0 -c -g="+this.config.gpio, {cwd: this.PathScript},(err, stdout, stderr)=> {
              if (err) logError(err)
              else {
                log("Relay is " + stdout.trim())
              }
            })
          } else {
            exec("python monitor.py -r=0 -g="+this.config.gpio, {cwd: this.PathScript},(err, stdout, stderr)=> {
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
            exec("python monitor.py -r=0 -c -g="+this.config.gpio, {cwd: this.PathScript},(err, stdout, stderr)=> {
              if (err) logError(err)
              else {
                log("Relay is " + stdout.trim())
              }
            })
          } else {
            exec("python monitor.py -r=0 -g="+this.config.gpio, {cwd: this.PathScript},(err, stdout, stderr)=> {
              if (err) logError(err)
              else {
                log("Relay is " + stdout.trim())
              }
            })
          }
        } else {
          exec("python monitor.py -r=1 -g="+this.config.gpio, { cwd: this.PathScript }, (err, stdout, stderr)=> {
            if (err) logError(err)
            else log("Relay is " + stdout.trim())
          })
        }
        break
      case 8:
        if (set) exec("ddcutil setvcp d6 1")
        else exec("ddcutil setvcp d6 4")
        break
    }
  }

  state() {
    this.sendSocketNotification("SCREEN_STATE", this.screen)
  }

  SendScreenPowerState() {
    this.sendSocketNotification("SCREEN_POWER", this.screen.power)
  }

  logError(err) {
    console.error("[MMM-Pir] [LIB] [SCREEN] " + err)
    this.sendSocketNotification("SCREEN_ERROR", err)
  }
}

module.exports = SCREEN
