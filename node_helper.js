/**********************************
* node_helper for EXT-Screen v1.1 *
* BuGsounet ©03/22                *
**********************************/

const NodeHelper = require('node_helper')
const LibScreen = require("@bugsounet/screen")
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
    console.log("[SCREEN] Initialized")
  },

  socketNotificationReceived: function (notification, payload) {
    switch(notification) {
      case "INIT":
        this.config = payload
        this.config.useScreen= true
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
