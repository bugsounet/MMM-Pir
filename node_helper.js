/**************************
* node_helper for MMM-Pir *
* BuGsounet               *
***************************/

var log = (...args) => { /* do nothing */ };
const LibScreen = require("./components/screenLib.js");
const LibPir = require("./components/pirLib.js");
const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  start () {
    this.pir = null;
    this.screen = null;
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "INIT":
        this.config = payload;
        this.parse();
        break;
      case "WAKEUP":
        this.screen.wakeup();
        break;
      case "FORCE_END":
        this.screen.forceEnd();
        break;
      case "LOCK":
        this.screen.lock();
        break;
      case "UNLOCK":
        this.screen.unlock();
        break;
      case "LOCK_FORCE_END":
        this.screen.forceLockOFF();
        break;
      case "LOCK_FORCE_WAKEUP":
        this.screen.forceLockON();
        break;
    }
  },

  async parse () {
    if (this.config.debug) log = (...args) => { console.log("[MMM-Pir]", ...args); };
    console.log("[MMM-Pir] Version:", require("./package.json").version, "rev:", require("./package.json").rev);
    var callbacks = {
      screen: (noti, params) => {
        log("[CALLBACK] Screen:", noti, params || "");
        this.sendSocketNotification(noti, params);
      },
      pir: (noti, params) => {
        log("[CALLBACK] Pir:", noti, params || "");
        if (noti === "PIR_DETECTED") this.screen.wakeup();
        else this.sendSocketNotification(noti, params);
      }
    };
    let pirConfig = {
      debug: this.config.debug,
      gpio: this.config.pir_gpio
    };

    let screenConfig = {
      debug: this.config.debug,
      delay: this.config.delay,
      mode: this.config.mode,
      gpio: this.config.mode6_gpio,
      clearGpioValue: this.config.mode6_clearGpioValue,
      xrandrForceRotation: this.config.xrandrForceRotation,
      wrandrForceRotation: this.config.wrandrForceRotation,
      wrandrForceMode: this.config.wrandrForceMode
    };

    this.pir = new LibPir(pirConfig, callbacks.pir);
    this.pir.start();
    this.screen = new LibScreen(screenConfig, callbacks.screen);
    this.screen.activate();
    console.log("[MMM-Pir] Started!");
    this.sendSocketNotification("INITIALIZED");
  }
});
