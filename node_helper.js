/*******************************
* node_helper for MMM-Pir v1.2 *
* BuGsounet                    *
********************************/

var log = (...args) => { /* do nothing */ }
const NodeHelper = require('node_helper')

module.exports = NodeHelper.create({
  start: function() {
    this.lib = { error: 0 }
    this.pir = null
    this.screen = null
  },

  socketNotificationReceived: function (notification, payload) {
    switch(notification) {
      case "INIT":
        this.config = payload
        this.parse()
        break
      case "WAKEUP":
        this.screen.wakeup()
        break
      case "FORCE_END":
        this.screen.forceEnd()
        break
      case "LOCK":
        this.screen.lock()
        break
      case "UNLOCK":
        this.screen.unlock()
        break
      case "LOCK_FORCE_END":
        this.screen.forceLockOFF()
        break
      case "LOCK_FORCE_WAKEUP":
        this.screen.forceLockON()
        break
    }
  },

  parse: async function() {
    if (this.config.debug) log = (...args) => { console.log("[MMM-Pir]", ...args) }
    console.log("[MMM-Pir] Version:", require('./package.json').version, "rev:", require('./package.json').rev )
    let bugsounet = await this.libraries()
    if (bugsounet) {
      console.error("[MMM-Pir] [LIBRARY] Warning:", bugsounet, "needed library not loaded !")
      console.error("[MMM-Pir] [LIBRARY] Try to solve it with `npm run rebuild` in MMM-Pir directory")
      this.sendSocketNotification("FatalError", bugsounet)
      return
    }
    var callbacks = {
      "screen": (noti, params) => {
        log("[CALLBACK] Screen:", noti,params || "")
        this.sendSocketNotification(noti, params)
      },
      "pir": (noti, params) => {
        log("[CALLBACK] Pir:", noti,params || "")
        if (noti == "PIR_DETECTED") this.screen.wakeup()
        else this.sendSocketNotification(noti, params)
      }
    }
    let pirConfig= {
      debug: this.config.debug,
      gpio: this.config.pir_gpio,
      reverseValue: this.config.pir_reverseValue
    }

    let screenConfig= {
      debug: this.config.debug,
      delay: this.config.delay,
      mode: this.config.mode,
      gpio: this.config.mode6_gpio,
      clearGpioValue: this.config.mode6_clearGpioValue,
      xrandrForceRotation: this.config.xrandrForceRotation,
      wrandrForceRotation: this.config.wrandrForceRotation,
      wrandrForceMode: this.config.wrandrForceMode
    }

    this.pir = new this.lib.Pir(pirConfig, callbacks.pir)
    this.pir.start()
    this.screen = new this.lib.Screen(screenConfig, callbacks.screen)
    this.screen.activate()
    console.log("[MMM-Pir] Started!")
    this.sendSocketNotification("INITIALIZED")
  },

  /** Load sensible library without black screen **/
  libraries: function() {
    let libraries= [
      // { "library to load" : "store library name" }
      { "./components/pirLib.js": "Pir" },
      { "./components/screenLib.js": "Screen" }
    ]
    let errors = 0
    return new Promise(resolve => {
      libraries.forEach(library => {
        for (const [name, configValues] of Object.entries(library)) {
          let libraryToLoad = name
          let libraryName = configValues
          try {
            if (!this.lib[libraryName]) {
              this.lib[libraryName] = require(libraryToLoad)
              log(`[DATABASE] Loaded: ${libraryToLoad} --> this.lib.${libraryName}`)
            }
          } catch (e) {
            console.error(`[MMM-Pir] [DATABASE] ${libraryToLoad} Loading error!`, e.message)
            this.sendSocketNotification("WARNING" , {library: libraryToLoad })
            errors++
            this.lib.error = errors
          }
        }
      })
      if (!errors) console.log("[MMM-Pir] [DATABASE] All libraries loaded!")
      resolve(errors)
    })
  }
});
