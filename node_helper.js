/**************************
* node_helper for MMM-Pir *
* BuGsounet               *
***************************/

var log = (...args) => { /* do nothing */ };
const NodeHelper = require("node_helper");
const LibScreen = require("./components/screenLib.js");
const LibPir = require("./components/pirLib.js");

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
    log("Config:", this.config);
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
      gpio: this.config.Pir.gpio,
      mode: this.config.Pir.mode
    };

    let screenConfig = {
      debug: this.config.debug,
      timeout: this.config.Display.timeout,
      mode: this.config.Display.mode,
      autoDimmer: this.config.Display.autoDimmer,
      xrandrForceRotation: this.config.Display.xrandrForceRotation,
      wrandrForceRotation: this.config.Display.wrandrForceRotation,
      wrandrForceMode: this.config.Display.wrandrForceMode
    };

    if (!this.pir && !this.screen) {
      /* will allow multi-instance
       *
       * don't load again lib and screen scripts
       * just only use it if loaded
       */
      this.pir = new LibPir(pirConfig, callbacks.pir);
      this.pir.start();
      this.screen = new LibScreen(screenConfig, callbacks.screen);
      this.screen.activate();
      console.log("[MMM-Pir] Started!");
    } else {
      console.log("[MMM-Pir] Already Started!");
    }
    this.sendSocketNotification("INITIALIZED");
  }
});
