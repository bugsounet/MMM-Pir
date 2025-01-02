/**************************
* node_helper for MMM-Pir *
* BuGsounet               *
***************************/

var log = () => { /* do nothing */ };
const NodeHelper = require("node_helper");
const LibScreen = require("./components/screenLib");
const LibPir = require("./components/pirLib");
const LibCron = require("./components/cronJob");
const LibGovernor = require("./components/governorLib");

module.exports = NodeHelper.create({
  start () {
    this.pir = null;
    this.screen = null;
    this.cron = null;
    this.governor = null;
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
      case "LOCK_FORCE_TOOGLE":
        this.screen.forceLockToggle();
        break;
    }
  },

  async parse () {
    if (this.config.debug) log = (...args) => { console.log("[MMM-Pir]", ...args); };
    console.log("[MMM-Pir] Version:", require("./package.json").version, "rev:", require("./package.json").rev);
    log("Config:", this.config);
    var callbacks = {
      // from screenLib
      screen: {
        sendSocketNotification: (noti, params) => {
          log("[CALLBACK] Screen:", noti, params || "");
          this.sendSocketNotification(noti, params);
        },
        // from screenLib to governorLib
        governor: (state) => {
          if (this.governor) {
            log("[CALLBACK] Screen for Governor:", state);
            if (state === "WORKING") this.governor.working();
            if (state === "SLEEPING") this.governor.sleeping();
          }
        }
      },
      // from pirLib
      pir: (noti, params) => {
        log("[CALLBACK] Pir:", noti, params || "");
        if (noti === "PIR_DETECTED") {
          this.screen.wakeup();
          this.sendSocketNotification("PIR_DETECTED-ANIMATE");
        } else {
          this.sendSocketNotification(noti, params);
        }
      },
      // from cronLib
      cron: {
        cronState: (param) => {
          log("[CALLBACK] Cron: cronState", param);
          this.screen.cronState(param);
        },
        error: (params) => {
          this.sendSocketNotification("CRON_ERROR", params);
        },
        error_unspecified: (code) => {
          this.sendSocketNotification("CRON_ERROR_UNSPECIFIED", code);
        }
      },
      // from governorLib
      governor: {
        error: (params) => {
          this.sendSocketNotification("GOVERNOR_ERROR", params);
        }
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
      relayGPIOPin: this.config.Display.relayGPIOPin,
      autoDimmer: this.config.Display.autoDimmer,
      xrandrForceRotation: this.config.Display.xrandrForceRotation,
      wrandrForceRotation: this.config.Display.wrandrForceRotation,
      wrandrForceMode: this.config.Display.wrandrForceMode,
      waylandDisplayName: this.config.Display.waylandDisplayName,
      animate: this.config.Display.animate,
      ddcutil: this.config.Display.ddcutil
    };

    let cronConfig = {
      debug: this.config.debug,
      mode: this.config.Cron.mode,
      ON: this.config.Cron.ON,
      OFF: this.config.Cron.OFF
    };

    let governorConfig = {
      debug: this.config.debug,
      sleeping: this.config.Governor.sleeping,
      working: this.config.Governor.working
    };

    if (!this.screen) {

      /* will allow multi-instance
       *
       * don't load again lib and screen scripts
       * just only use it if loaded
       */

      this.pir = new LibPir(pirConfig, callbacks.pir);
      this.pir.start();

      this.governor = new LibGovernor(governorConfig, callbacks.governor);
      this.governor.start();

      this.screen = new LibScreen(screenConfig, callbacks.screen);
      this.screen.activate();

      this.cron = new LibCron(cronConfig, callbacks.cron);
      this.cron.start();

      console.log("[MMM-Pir] Started!");
    } else {
      console.log("[MMM-Pir] Already Started!");
    }
    this.sendSocketNotification("INITIALIZED");
  }
});
