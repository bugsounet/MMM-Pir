/** Screen management **/
/** bugsounet **/

const exec = require('child_process').exec
const process = require('process')
const moment = require('moment')
const path = require('path')

var _log = function() {
    var context = "[SCREEN]"
    return Function.prototype.bind.call(console.log, console, context)
}()

var log = function() {
  //do nothing
}

class SCREEN {
  constructor(config, callback, debug, detectorControl, governorControl) {
    this.config = config
    this.sendSocketNotification = callback
    this.detector = detectorControl
    this.governor = governorControl
    if (debug == true) log = _log
    this.PathScript = path.dirname(require.resolve('../package.json'))+"/lib"
    console.log(this.PathScript)
    this.interval = null
    this.default = {
      animateBody: false,
      animateTime: 3000,
      delay: 5 * 60 * 1000,
      turnOffDisplay: true,
      ecoMode: true,
      displayCounter: true,
      displayBar: false,
      detectorSleeping: false,
      governorSleeping: false,
      mode: 1,
      delayed: 0,
      gpio: 20,
      clearGpioValue: true
    }
    this.config = Object.assign(this.default, this.config)
    this.screen = {
      mode: this.config.mode,
      running: false,
      locked: false,
      power: false,
      delayed: this.config.delayed,
      isDelayed: false,
      awaitBeforeTurnOff: this.config.animateBody,
      awaitBeforeTurnOffTimer: null,
      awaitBeforeTurnOffTime: this.config.animateTime
    }
    if (this.config.turnOffDisplay) {
      switch (this.config.mode) {
        case 0:
          console.log("[SCREEN] Mode 0: Disabled")
          break
        case 1:
          console.log("[SCREEN] Mode 1: vcgencmd")
          break
        case 2:
          console.log("[SCREEN] Mode 2: dpms rpi")
          break
        case 3:
          console.log("[SCREEN] Mode 3: tvservice")
          break
        case 4:
          console.log("[SCREEN] Mode 4: HDMI CEC")
          break
        case 5:
          console.log("[SCREEN] Mode 5: dpms linux")
          break
        case 6:
          console.log("[SCREEN] Mode 6: Python script (Relay on/off)")
          break
        case 7:
          console.log("[SCREEN] Mode 7: Python script reverse (Relay on/off)")
          break
        default:
          this.logError("Unknow Mode Set to 0 (Disabled)")
          this.sendSocketNotification("ERROR", "[SCREEN] Unknow Mode (" + this.config.mode + ") Set to 0 (Disabled)")
          this.config.mode = 0
          break
      }
    }
  }

  activate () {
    if (!this.config.turnOffDisplay && !this.config.ecoMode) return log("Disabled.")
    process.on('exit', (code) => {
      if (this.config.turnOffDisplay && this.config.mode) this.setPowerDisplay(true)
      if (this.config.governorSleeping) this.governor("GOVERNOR_WORKING")
      console.log('[SCREEN] ByeBye !')
      console.log('[SCREEN] @bugsounet')
    })
    this.start()
  }

  start (restart) {
    if (this.screen.locked || this.screen.running || (!this.config.turnOffDisplay && !this.config.ecoMode)) return
    if (!restart) log("Start.")
    else log("Restart.")
    clearTimeout(this.screen.awaitBeforeTurnOffTimer)
    this.screen.awaitBeforeTurnOffTimer= null
    this.sendSocketNotification("SCREEN_PRESENCE", true)
    if (!this.screen.power) {
      if (this.config.turnOffDisplay && this.config.mode) this.wantedPowerDisplay(true)
      if (this.config.ecoMode) {
        this.sendSocketNotification("SCREEN_SHOWING")
        this.screen.power = true
      }
      if (this.config.governorSleeping) this.governor("GOVERNOR_WORKING")
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
        if (this.config.detectorSleeping) this.detector("DETECTOR_STOP")
        if (this.config.governorSleeping) this.governor("GOVERNOR_SLEEPING")
        this.sendSocketNotification("SCREEN_PRESENCE", false)
        log("Stops by counter.")
      }
      this.counter -= 1000
    }, 1000)
  }

  stop () {
    if (this.screen.locked) return

    if (!this.screen.power) {
      if (this.config.governorSleeping) this.governor("GOVERNOR_WORKING")
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
    this.screen.isDelayed = false
    this.start(true)
  }

  wakeup() {
    if (this.screen.locked || this.screen.isDelayed) return
    if (this.screen.delayed && !this.screen.power) {
      this.screen.isDelayed = true
      log("Delayed wakeup in", this.screen.delayed, "ms")
      setTimeout(() => {
        log("Delayed wakeup")
        if (this.config.detectorSleeping) this.detector("DETECTOR_START")
        this.reset()
      }, this.screen.delayed)
    } else {
      if (!this.screen.power && this.config.detectorSleeping) this.detector("DETECTOR_START")
      this.reset()
    }
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
    log("Unlocked !")
    this.screen.locked = false
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
    if (this.screen.awaitBeforeTurnOff && !set) await this.sleep(this.screen.awaitBeforeTurnOffTime)
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
            if (err) console.log("[SCREEN] err:", err)
            else log("Relay is " + stdout.trim())
          })
        else
          if (this.config.clearGpioValue) {
            exec("python monitor.py -r=0 -c -g="+this.config.gpio, {cwd: this.PathScript},(err, stdout, stderr)=> {
              if (err) console.log("[SCREEN] err:", err)
              else {
                log("Relay is " + stdout.trim())
              }
            })
          } else {
            exec("python monitor.py -r=0 -g="+this.config.gpio, {cwd: this.PathScript},(err, stdout, stderr)=> {
              if (err) console.log("[SCREEN] err:", err)
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
              if (err) console.log("[SCREEN] err:", err)
              else {
                log("Relay is " + stdout.trim())
              }
            })
          } else {
            exec("python monitor.py -r=0 -g="+this.config.gpio, {cwd: this.PathScript},(err, stdout, stderr)=> {
              if (err) console.log("[SCREEN] err:", err)
              else {
                log("Relay is " + stdout.trim())
              }
            })
          }
        } else {
          exec("python monitor.py -r=1 -g="+this.config.gpio, { cwd: this.PathScript }, (err, stdout, stderr)=> {
            if (err) console.log("[SCREEN] err:", err)
            else log("Relay is " + stdout.trim())
          })
        }
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
    console.error("[SCREEN] " + err)
  }

  sleep(ms=1300) {
    return new Promise((resolve) => {
      this.screen.awaitBeforeTurnOffTimer = setTimeout(resolve, ms)
    })
  }
}

module.exports = SCREEN
