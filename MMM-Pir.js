/****************
*  MMM-Pir v1.2 *
*  Bugsounet    *
*  02/2024      *
*****************/

/* global screenDisplayer, screenTouch */

var _logPIR = (...args) => { /* do nothing */ };

Module.register("MMM-Pir", {
  requiresVersion: "2.23.0",
  defaults: {
    debug: false,
    delay: 2 * 60 * 1000,
    mode: 1,
    touchMode: 3,
    displayCounter: true,
    displayBar: true,
    displayStyle: "Text",
    displayLastPresence: true,
    lastPresenceTimeFormat: "LL H:mm",
    mode6_gpio: 20,
    mode6_clearGpioValue: true,
    pir_gpio: 21,
    xrandrForceRotation: "normal",
    wrandrForceRotation: "normal",
    wrandrForceMode: null
  },

  start () {
    if (this.config.debug) _logPIR = (...args) => { console.log("[MMM-Pir]", ...args); };
    this.userPresence = null;
    this.lastPresence = null;
    this.ready = false;
    let Tools = {
      sendSocketNotification: (...args) => this.sendSocketNotification(...args),
      hidden: () => { return this.hidden; },
      translate: (...args) => this.translate(...args)
    };
    let displayConfig = {
      displayCounter: this.config.displayCounter,
      displayBar: this.config.displayBar,
      displayStyle: this.config.displayStyle,
      displayLastPresence: this.config.displayLastPresence,
      delay: this.config.delay
    };
    this.screenDisplay = new screenDisplayer(displayConfig, Tools);
    this.screenDisplay.checkStyle();
    this.screenTouch = new screenTouch(this.config.touchMode, Tools);
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
        if (this.config.displayStyle === "Text") {
          let counter = document.getElementById("MMM-PIR_SCREEN_COUNTER");
          counter.textContent = payload.timer;
        } else {
          this.screenDisplay.barAnimate(payload.bar);
        }
        break;
      case "SCREEN_PRESENCE":
        if (!this.config.displayLastPresence) return;
        if (payload) this.lastPresence = moment().format(this.config.lastPresenceTimeFormat);
        else this.userPresence = this.lastPresence;
        if (this.userPresence) {
          let presence = document.getElementById("MMM-PIR_PRESENCE");
          presence.classList.remove("hidden");
          presence.classList.add("bright");
          let userPresence = document.getElementById("MMM-PIR_PRESENCE_DATE");
          userPresence.textContent = this.userPresence;
        }
        break;
      case "SCREEN_POWERSTATUS":
        if (payload) this.sendNotification("USER_PRESENCE", true);
        else this.sendNotification("USER_PRESENCE", false);
        break;
      case "WARNING":
        this.sendNotification("SHOW_ALERT", {
          type: "notification",
          title: "MMM-Pir",
          message: `Warning: Library not loaded: ${payload.library}`,
          timer: 15000
        });
        break;
      case "FatalError":
        this.sendNotification("SHOW_ALERT", {
          title: "MMM-Pir",
          message: `<p>FATAL: ${payload} needed library not loaded !<br>Try to solve it with 'npm run rebuild' in MMM-Pir Folder</p>`,
          timer: 0
        });
        break;
      case "SCREEN_ERROR":
      case "PIR_ERROR":
        this.sendNotification("SHOW_ALERT", {
          type: "notification",
          title: "MMM-Pir",
          message: `Pir Error detected: ${payload}`,
          timer: 15000
        });
    }
  },

  notificationReceived (notification, payload, sender) {
    if (notification === "MODULE_DOM_CREATED") {
      this.screenDisplay.prepareBar();
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
    return this.screenDisplay.prepare();
  },

  getStyles () {
    return ["MMM-Pir.css"];
  },

  getScripts () {
    return [
      "/modules/MMM-Pir/components/progressbar.js",
      "/modules/MMM-Pir/components/screenDisplayer.js",
      "/modules/MMM-Pir/components/long-press-event.js",
      "/modules/MMM-Pir/components/screenTouch.js"
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
