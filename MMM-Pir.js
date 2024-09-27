/*************
*  MMM-Pir   *
*  Bugsounet *
*  09/2024   *
*************/

/* global screenDisplayer, screenTouch */

var _logPIR = (...args) => { /* do nothing */ };

Module.register("MMM-Pir", {
  requiresVersion: "2.23.0",
  defaults: {
    debug: false,
    Display: {
      colorFrom: "#FF0000",
      colorTo: "#00FF00",
      timeout: 2 * 60 * 1000,
      mode: 1,
      counter: true,
      style: 1,
      lastPresence: true,
      lastPresenceTimeFormat: "LL H:mm",
      xrandrForceRotation: "normal",
      wrandrForceRotation: "normal",
      wrandrForceMode: null
    },
    Pir: {
      mode: 0,
      gpio: 21
    },
    Touch: {
      mode: 3
    }
  },

  start () {
    if (this.config.debug) _logPIR = (...args) => { console.log("[MMM-Pir]", ...args); };
    this.ready = false;
    let Tools = {
      sendSocketNotification: (...args) => this.sendSocketNotification(...args),
      hidden: () => { return this.hidden; },
      translate: (...args) => this.translate(...args)
    };
    let displayConfig = {
      colorFrom:this.config.Display.colorFrom,
      colorTo:this.config.Display.colorTo,
      counter: this.config.Display.counter,
      style: this.config.Display.style,
      lastPresence: this.config.Display.lastPresence,
      lastPresenceTimeFormat: this.config.Display.lastPresenceTimeFormat,
      timeout: this.config.Display.timeout
    };
    this.screenDisplay = new screenDisplayer(displayConfig, Tools);
    this.screenTouch = new screenTouch(this.config.Touch, Tools);
    _logPIR("is now started!");
  },

  socketNotificationReceived (notification, payload) {
    switch (notification) {
      case "INITIALIZED":
        _logPIR("Ready to fight MagicMirror²!");
        this.screenTouch.touch();
        this.ready = true;
        break;
      case "SCREEN_SHOWING":
        this.screenDisplay.screenShowing();
        break;
      case "SCREEN_HIDING":
        this.screenDisplay.screenHiding();
        break;
      case "SCREEN_OUTPUT":
        this.screenDisplay.updateDisplay(payload);
        break;
      case "SCREEN_PRESENCE":
        this.screenDisplay.updatePresence(payload);
        break;
      case "SCREEN_POWERSTATUS":
        if (payload) this.sendNotification("USER_PRESENCE", true);
        else this.sendNotification("USER_PRESENCE", false);
        break;
      case "SCREEN_ERROR":
        this.sendNotification("SHOW_ALERT", {
          type: "notification",
          title: "MMM-Pir",
          message: `Screen Error detected: ${payload}`,
          timer: 15000
        });
        break;
      case "PIR_ERROR":
        this.sendNotification("SHOW_ALERT", {
          type: "notification",
          title: "MMM-Pir",
          message: `Pir Error detected: ${payload}`,
          timer: 15000
        });
        break;
    }
  },

  notificationReceived (notification, payload, sender) {
    if (notification === "MODULE_DOM_CREATED") {
      this.screenDisplay.prepareStyle();
      this.sendSocketNotification("INIT", this.config);
    }
    if (!this.ready) return;
    switch (notification) {
      case "MMM_PIR-END":
        /** only available if not force-locked by touch **/
        this.sendSocketNotification("FORCE_END");
        break;
      case "MMM_PIR-WAKEUP":
        /** only available if not force-locked by touch **/
        this.sendSocketNotification("WAKEUP");
        break;
      case "MMM_PIR-LOCK":
        /** only available if not force-locked by touch **/
        this.sendSocketNotification("LOCK");
        break;
      case "MMM_PIR-UNLOCK":
        /** only available if not force-locked by touch **/
        this.sendSocketNotification("UNLOCK");
        break;
      case "USER_PRESENCE":
        /** only available if not force-locked by touch **/
        if (payload) this.sendSocketNotification("WAKEUP");
        else this.sendSocketNotification("FORCE_END");
    }
  },

  getDom () {
    return this.screenDisplay.prepareDom();
  },

  getStyles () {
    return ["MMM-Pir.css"];
  },

  getScripts () {
    return [
      "/modules/MMM-Pir/components/screenDisplayer.js",
      "/modules/MMM-Pir/components/screenTouch.js",
      "/modules/MMM-Pir/node_modules/long-press-event/dist/long-press-event.min.js",
      "/modules/MMM-Pir/node_modules/progressbar.js/dist/progressbar.min.js"
    ];
  },

  getTranslations () {
    return {
      en: "translations/en.json",
      fr: "translations/fr.json",
      it: "translations/it.json",
      de: "translations/de.json",
      es: "translations/es.json",
      nl: "translations/nl.json",
      pt: "translations/pt.json",
      ko: "translations/ko.json",
      el: "translations/el.json"
    };
  }
});
