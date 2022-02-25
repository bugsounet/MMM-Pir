/********************************
* node_helper for EXT-Screen v1 *
* BuGsounet ©02/22              *
********************************/

const NodeHelper = require('node_helper')

var log = (...args) => { /* do nothing */ }

module.exports = NodeHelper.create({
  start: function() {
    this.lib = {}
    this.forceLocked = false
  },

  initialize: async function() {
    if (this.config.debug) log = (...args) => { console.log("[SCREEN]", ...args) }
    console.log("[GATEWAY] EXT-Screen Version:", require('./package.json').version, "rev:", require('./package.json').rev)
    /** check if update of npm Library needed **/
    let bugsounet = await this.loadBugsounetLibrary()
    if (bugsounet) {
      console.error("[SCREEN] Warning:", bugsounet, "needed @bugsounet library not loaded !")
      console.error("[SCREEN] Try to solve it with `npm run rebuild` in EXT-Screen directory")
      return
    }
    else {
      console.log("[SCREEN] All needed @bugsounet library loaded !")
    }
    this.Screen()
    console.log("[SCREEN] Initialized ")
  },

  socketNotificationReceived: function (notification, payload) {
    switch(notification) {
      case "INIT":
        this.config = payload
        this.config.screen.useScreen= true
        this.initialize()
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
      case "FORCELOCK":
        this.forceLocked = true
        this.screen.lock()
        break
      case "UNLOCK":
        if (this.forceLocked) return log("Sorry, it's Force-Locked!")
        this.screen.unlock()
        break
      case "FORCEUNLOCK":
        this.forceLocked = false
        this.screen.unlock()
        break
    }
  },

  Screen: function () {
    var callbacks= {
      "sendSocketNotification": (noti, params) => {
        this.sendSocketNotification(noti, params)
        log("Callback Notification:", noti,params)
      },
      "governor": (gov) => {
        this.sendSocketNotification(gov)
      },
    }
    /** constructor(config, callback, debug, detectorControl, governorControl) **/
    this.screen = new this.lib.Screen(
      this.config.screen,
      callbacks.sendSocketNotification,
      this.config.debug,
      callbacks.sendSocketNotification,
      callbacks.governor
    )
    this.screen.activate()
  },

  /** Load require @busgounet library **/
  /** It will not crash MM (black screen) **/
  loadBugsounetLibrary: function() {
    let libraries= [
      // { "library to load" : [ "store library name", "path to check"] }
      { "@bugsounet/screen": [ "Screen", "screen.useScreen" ] }
    ]
    let errors = 0
    return new Promise(resolve => {
      libraries.forEach(library => {
        for (const [name, configValues] of Object.entries(library)) {
          let libraryToLoad = name,
              libraryName = configValues[0],
              libraryPath = configValues[1],
              index = (obj,i) => { return obj[i] },
              libraryActivate = libraryPath.split(".").reduce(index,this.config)

          // libraryActivate: verify if the needed path of config is activated (result of reading config value: true/false) **/
          if (libraryActivate) {
            try {
              if (!this.lib[libraryName]) {
                this.lib[libraryName] = require(libraryToLoad)
                log("Loaded " + libraryToLoad)
              }
            } catch (e) {
              console.error("[SCREEN]", libraryToLoad, "Loading error!" , e)
              this.sendSocketNotification("WARNING" , {library: libraryToLoad })
              errors++
            }
          }
        }
      })
      resolve(errors)
    })
  }
});
