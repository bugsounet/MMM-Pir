/** parse data from MagicMirror **/
var _load = require("../components/loadLibraries.js")
var log = (...args) => { /* do nothing */ }

async function init(that) {
  that.lib = { error: 0 }
  that.pir = null
  that.screen = null
}

async function parse(that) {
  if (that.config.debug) log = (...args) => { console.log("[MMM-Pir]", ...args) }
  console.log("[MMM-Pir] Version:", require('../package.json').version, "rev:", require('../package.json').rev )
  let bugsounet = await _load.libraries(that)
  if (bugsounet) {
    console.error("[MMM-Pir] [DATA] Warning:", bugsounet, "needed library not loaded !")
    console.error("[MMM-Pir] [DATA] Try to solve it with `npm run rebuild` in MMM-Pir directory")
    that.sendSocketNotification("FatalError", bugsounet)
    return
  }
  var callbacks = {
    "screen": (noti, params) => {
      log("Screen Callback:", noti,params)
      that.sendSocketNotification(noti, params)
    },
    "pir": (noti, params) => {
      log("Pir Callback:", noti,params)
      if (noti == "PIR_DETECTED") that.screen.wakeup()
      else that.sendSocketNotification(noti, params)
    }
  }
  let pirConfig= {
    libGpio: that.lib.onoff.Gpio,
    debug: that.config.debug,
    gpio: that.config.pir_gpio,
    reverseValue: that.config.pir_reverseValue
  }

  let screenConfig= {
    delay: that.config.delay,
    turnOffDisplay: that.config.turnOffDisplay,
    ecoMode: that.config.ecoMode,
    displayCounter: that.config.displayCounter,
    displayBar: that.config.displayBar,
    mode: that.config.mode,
    gpio: that.config.mode6_gpio,
    clearGpioValue: that.config.mode6_clearGpioValue
  }

  that.pir = new that.lib.Pir(pirConfig, callbacks.pir)
  that.pir.start()
  that.screen = new that.lib.Screen(screenConfig, callbacks.screen)
  that.screen.activate()
  that.sendSocketNotification("INITIALIZED")
}

exports.init = init
exports.parse = parse
