/**********************************
* node_helper for EXT-Screen v1.1 *
* BuGsounet ©03/22                *
**********************************/

const NodeHelper = require('node_helper')
const LibScreen = require("./lib/screenLib.js")
var log = (...args) => { /* do nothing */ }

module.exports = NodeHelper.create({
  start: function() {
    this.lib = {}
    this.forceLocked = false
  },

  initialize: async function() {
    if (this.config.debug) log = (...args) => { console.log("[SCREEN]", ...args) }
    console.log("[SCREEN] EXT-Screen Version:", require('./package.json').version, "rev:", require('./package.json').rev)
    this.Screen()
    this.sendSocketNotification("INITIALIZED")
  },

  socketNotificationReceived: function (notification, payload) {
    switch(notification) {
      case "INIT":
        this.config = payload
        this.config.useScreen= true
        this.initialize()
        break
      case "WAKEUP":
        if (this.forceLocked) return log("[WAKEUP] Sorry, it's Force-Locked!")
        this.screen.wakeup()
        break
      case "FORCE_END":
        if (this.forceLocked) return log("[FORCE_END] Sorry, it's Force-Locked!")
        this.screen.forceEnd()
        break
      case "LOCK":
        if (this.forceLocked) return log("[LOCK] Sorry, it's Force-Locked!")
        this.screen.lock()
        break
      case "FORCELOCK":
        this.forceLocked = true
        this.screen.lock()
        break
      case "UNLOCK":
        if (this.forceLocked) return log("[UNLOCK] Sorry, it's Force-Locked!")
        this.screen.unlock()
        break
      case "FORCEUNLOCK":
        this.forceLocked = false
        this.screen.unlock()
        break
      case "GH_FORCE_END":
        if (this.forceLocked) return log("[GH_FORCE_END] Sorry, it's Force-Locked!")
        this.screen.GHforceEndAndLock()
        this.forceLocked = true
        break
      case "GH_FORCE_WAKEUP":
        this.forceLocked = false
        this.screen.GHforceWakeUp()
        break
    }
  },

  Screen: function () {
    var callbacks= {
      "sendSocketNotification": (noti, params) => {
        this.sendSocketNotification(noti, params)
        //log("Callback Notification:", noti,params)
      },
      "governor": (gov) => {
        this.sendSocketNotification(gov)
      },
    }
    /** constructor(
     *    config,
     *    callback,
     *    debug,
     *    detectorControl,
     *    governorControl
     * ) **/
    this.screen = new LibScreen(
      this.config,
      callbacks.sendSocketNotification,
      this.config.debug,
      callbacks.sendSocketNotification,
      callbacks.governor
    )
    this.screen.activate()
  }
});
