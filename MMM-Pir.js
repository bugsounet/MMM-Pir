/****************
*  MMM-Pir v1.0 *
*  Bugsounet    *
*  05/2023      *
*****************/

var _logPIR = (...args) => { /* do nothing */ }

Module.register("MMM-Pir", {
    requiresVersion: "2.23.0",
    defaults: {
      debug: false,
      delay: 2 * 60 * 1000,
      turnOffDisplay: true,
      mode: 1,
      ecoMode: true,
      displayCounter: true,
      displayBar: true,
      displayStyle: "Text",
      displayLastPresence: true,
      lastPresenceTimeFormat: "LL H:mm",
      mode6_gpio: 20,
      mode6_clearGpioValue: true,
      pir_gpio: 21,
      pir_reverseValue: false
    },

    start: function () {
      if (this.config.debug) _logPIR = (...args) => { console.log("[MMM-Pir]", ...args) }
      this.userPresence = null
      this.lastPresence = null
      this.ready = false
      this.screenDisplay = new screenDisplayer(this)
      this.screenDisplay.checkStyle()
      _logPIR("is now started!")
    },

    socketNotificationReceived: function (notification, payload) {
      switch(notification) {
        case "INITIALIZED":
          _logPIR("Ready to fight MagicMirror²!")
          this.ready = true
          break
        case "SCREEN_SHOWING":
          this.screenDisplay.screenShowing()
          break
        case "SCREEN_HIDING":
          this.screenDisplay.screenHiding()
          break
        case "SCREEN_TIMER":
          if (this.config.displayStyle == "Text") {
            let counter = document.getElementById("MMM-PIR_SCREEN_COUNTER")
            counter.textContent = payload
          }
          break
        case "SCREEN_BAR":
          if (this.config.displayStyle == "Bar") {
            let bar = document.getElementById("MMM-PIR_SCREEN_BAR")
            bar.value= this.config.delay - payload
          }
          else if (this.config.displayStyle != "Text") {
            this.screenDisplay.barAnimate(payload)
          }
          break
        case "SCREEN_PRESENCE":
          if (payload) this.lastPresence = moment().format(this.config.lastPresenceTimeFormat)
          else this.userPresence = this.lastPresence
          if (this.userPresence && this.config.displayLastPresence) {
            let presence= document.getElementById("MMM-PIR_PRESENCE")
            presence.classList.remove("hidden")
            presence.classList.add("bright")
            let userPresence= document.getElementById("MMM-PIR_PRESENCE_DATE")
            userPresence.textContent = this.userPresence
          }
          break
        case "SCREEN_POWER":
          if (payload) { // user presence
            this.sendNotification("MMM_PIR-ON")
          } else {
            this.sendNotification("MMM_PIR-OFF")
          }
          break
        case "WARNING":
          this.sendNotification("SHOW_ALERT", {
            type: "notification",
            title: "MMM-Pir",
            message: `Warning: Library not loaded: ${payload.library}`,
            timer: 15000
          })
          break
        case "FatalError":
          this.sendNotification("SHOW_ALERT", {
            title: "MMM-Pir",
            message: `<p>FATAL: ${payload} needed library not loaded !<br>Try to solve it with 'npm run rebuild' in MMM-Pir Folder</p>`,
            timer: 0
          })
          break
        case "SCREEN_ERROR":
        case "PIR_ERROR":
          this.sendNotification("SHOW_ALERT", {
            type: "notification",
            title: "MMM-Pir",
            message: `Error detected: ${payload}`,
            timer: 15000
          })
      }
    },

    notificationReceived: function (notification, payload, sender) {
      if (notification == "MODULE_DOM_CREATED") {
        this.screenDisplay.prepareBar()
        this.sendSocketNotification("INIT", this.config)
      }
      if (!this.ready) return
      switch(notification) {
        case "MMM_PIR-END":
          this.sendSocketNotification("FORCE_END")
          break
        case "MMM_PIR-WAKEUP":
          this.sendSocketNotification("WAKEUP")
          break
        case "MMM_PIR-LOCK":
          this.sendSocketNotification("LOCK")
          break
        case "MMM_PIR-UNLOCK":
          this.sendSocketNotification("UNLOCK")
          break
      }
    },

    getDom: function () {
      return this.screenDisplay.prepare()
    },

    getStyles: function () {
      return [ "MMM-Pir.css" ]
    },

    getScripts: function () {
      return [
        "/modules/MMM-Pir/components/progressbar.js",
        "/modules/MMM-Pir/components/screenDisplayer.js"
      ]
    },

    getTranslations: function() {
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
      }
    }
});
