/** PIR library **/
/** bugsounet **/

var log = (...args) => { /* do nothing */ }
const Gpio = require("onoff").Gpio

class PIR {
  constructor(config, callback) {
    this.config = config
    if (this.config.debug) log = (...args) => { console.log("[MMM-Pir] [LIB] [PIR]", ...args) }
    this.callback = callback
    this.default = {
      debug: this.config.debug,
      gpio: 21,
      reverseValue: false
    }
    this.config = Object.assign({}, this.default, this.config)
    this.pir = null
    this.running = false
  }

  start () {
    if (this.running) return
    if (this.config.gpio === 0) return console.log("[MMM-Pir] [LIB] [PIR] Disabled.")
    log("Start")
    try {
      this.pir = new Gpio(this.config.gpio, 'in', 'both')
      this.callback("PIR_STARTED")
      console.log("[MMM-Pir] [LIB] [PIR] Started!")
    } catch (err) {
      console.error("[MMM-Pir] [LIB] [PIR] " + err)
      this.running = false
      return this.callback("PIR_ERROR", err.message)
    }
    this.running = true
    this.pir.watch((err, value)=> {
      if (err) {
        console.error("[MMM-Pir] [LIB] [PIR] " + err)
        return this.callback("PIR_ERROR", err.message)
      }
      log("Sensor read value: " + value)
      if ((value == 1 && !this.config.reverseValue) || (value == 0 && this.config.reverseValue)) {
        this.callback("PIR_DETECTED")
        log("Detected presence (value: " + value + ")")
      }
    })
  }

  stop () {
    if (!this.running || (this.config.gpio === 0)) return
    this.pir.unexport()
    this.pir = null
    this.running = false
    this.callback("PIR_STOP")
    log("Stop")
  }
}

module.exports = PIR
