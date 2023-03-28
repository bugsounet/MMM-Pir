/*******************
*  EXT-Screen v1.3 *
*  Bugsounet       *
*  03/2023         *
*******************/

var logScreen = (...args) => { /* do nothing */ }

Module.register("EXT-Screen", {
    requiresVersion: "2.22.0",
    defaults: {
      debug: false,
      animateBody: true,
      animateTime: 3000,
      delay: 2 * 60 * 1000,
      turnOffDisplay: true,
      mode: 1,
      ecoMode: true,
      displayCounter: true,
      displayBar: true,
      displayStyle: "Text",
      displayLastPresence: true,
      lastPresenceTimeFormat: "LL H:mm",
      autoHide: true,
      delayed: 0,
      detectorSleeping: false,
      gpio: 20,
      clearGpioValue: true,
      sound: false
    },

    start: function () {
      this.ignoreSender= [
        "Gateway",
        "EXT-Pir",
        "EXT-ScreenManager",
        "EXT-ScreenTouch",
        "EXT-Motion",
        "EXT-Keyboard",
        "EXT-StreamDeck"
      ]

      if (this.config.debug) logScreen = (...args) => { console.log("[SCREEN]", ...args) }
      this.userPresence = null
      this.lastPresence = null
      this.ready = false
      this.screenDisplay = new screenDisplayer(this)
      this.screenDisplay.checkStyle()
      logScreen("is now started!")
    },

    socketNotificationReceived: function (notification, payload) {
      switch(notification) {
        case "INITIALIZED":
          this.sendNotification("EXT_HELLO", this.name)
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
            let counter = document.getElementById("EXT-SCREEN_SCREEN_COUNTER")
            counter.textContent = payload
          }
          break
        case "SCREEN_BAR":
          if (this.config.displayStyle == "Bar") {
            let bar = document.getElementById("EXT-SCREEN_SCREEN_BAR")
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
            let presence= document.getElementById("EXT-SCREEN_PRESENCE")
            presence.classList.remove("hidden")
            presence.classList.add("bright")
            let userPresence= document.getElementById("EXT-SCREEN_PRESENCE_DATE")
            userPresence.textContent= this.userPresence
          }
          break
        case "SCREEN_POWER":
          if (payload) {
            this.sendNotification("EXT_SCREEN-ON")
            this.sendNotification("EXT_ALERT", {
              message: this.translate("ScreenPowerOn"),
              type: "information",
              sound: this.config.sound ? "modules/EXT-Screen/sounds/open.mp3" : null
            })
          } else {
            this.sendNotification("EXT_SCREEN-OFF")
            this.sendNotification("EXT_ALERT", {
              message: this.translate("ScreenPowerOff"),
              type: "information",
              sound: this.config.sound ? "modules/EXT-Screen/sounds/close.mp3" : null
            })
          }
          break
        case "GOVERNOR_SLEEPING":
          this.sendNotification("EXT_GOVERNOR-SLEEPING")
          break
        case "GOVERNOR_WORKING":
          this.sendNotification("EXT_GOVERNOR-WORKING")
          break
        case "DETECTOR_START":
          this.sendNotification("EXT_DETECTOR-START")
          break
        case "DETECTOR_STOP":
          this.sendNotification("EXT_DETECTOR-STOP")
          break
      }
    },

    notificationReceived: function (notification, payload, sender) {
      if (notification == "GW_READY") {
        if (sender.name == "Gateway") {
          if (this.config.animateBody) this.screenDisplay.prepareBody()
          this.screenDisplay.prepareBar()
          this.sendSocketNotification("INIT", this.config)
        }
      }
      if (!this.ready) return
      switch(notification) {
        case "EXT_SCREEN-END":
          this.sendSocketNotification("FORCE_END")
          break
        case "EXT_SCREEN-WAKEUP":
          this.sendSocketNotification("WAKEUP")
          if (this.ignoreSender.indexOf(sender.name) == -1) {
            this.sendNotification("EXT_ALERT", {
              message: this.translate("ScreenWakeUp", { VALUES: sender.name }),
              type: "information",
            })
          }
          break
        case "EXT_SCREEN-LOCK":
          this.sendSocketNotification("LOCK")
          let HiddenLock = true
          if (payload && payload.show) HiddenLock= false
          if (HiddenLock) this.screenDisplay.hideDivWithAnimatedFlip("EXT-SCREEN")
          if (this.ignoreSender.indexOf(sender.name) == -1) {
            this.sendNotification("EXT_ALERT", {
              message: this.translate("ScreenLock", { VALUES: sender.name }),
              type: "information"
            })
          }
          break
        case "EXT_SCREEN-FORCE_LOCK":
          this.sendSocketNotification("FORCELOCK")
          this.screenDisplay.hideDivWithAnimatedFlip("EXT-SCREEN")
          if (this.ignoreSender.indexOf(sender.name) == -1) {
            this.sendNotification("EXT_ALERT", {
              message: this.translate("ScreenLock", { VALUES: sender.name }),
              type: "information",
            })
          }
          break
        case "EXT_SCREEN-UNLOCK":
          this.sendSocketNotification("UNLOCK")
          let HiddenUnLock = true
          if (payload && payload.show) HiddenUnLock= false
          if (HiddenUnLock) this.screenDisplay.showDivWithAnimatedFlip("EXT-SCREEN")
          if (this.ignoreSender.indexOf(sender.name) == -1) {
            this.sendNotification("EXT_ALERT", {
              message: this.translate("ScreenUnLock", { VALUES: sender.name }),
              type: "information",
            })
          }
          break
        case "EXT_SCREEN-FORCE_UNLOCK":
          this.sendSocketNotification("FORCEUNLOCK")
          this.screenDisplay.showDivWithAnimatedFlip("EXT-SCREEN")
          if (this.ignoreSender.indexOf(sender.name) == -1) {
            this.sendNotification("EXT_ALERT", {
              message: this.translate("ScreenUnLock", { VALUES: sender.name }),
              type: "information",
            })
          }
          break
        case "EXT_SCREEN-GH_FORCE_END":
          this.sendSocketNotification("GH_FORCE_END")
          break
        case "EXT_SCREEN-GH_FORCE_WAKEUP":
          this.sendSocketNotification("GH_FORCE_WAKEUP")
          break
      }
    },

    getDom: function () {
      return this.screenDisplay.prepare()
    },

    getStyles: function () {
      return [ "EXT-Screen.css" ]
    },

    getScripts: function () {
      return [
        "/modules/EXT-Screen/components/progressbar.js",
        "/modules/EXT-Screen/components/screenDisplayer.js"
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
    },

    /** EXT-TelegramBot Commands **/
    EXT_TELBOTCommands: function(commander) {
      commander.add({
        command: "screen",
        description: "Screen power control",
        callback: "tbScreen"
      })
    },
    tbScreen: function(command, handler) {
      if (handler.args) {
        var args = handler.args.toLowerCase().split(" ")
        var params = handler.args.split(" ")
        if (args[0] == "on") {
          this.sendSocketNotification("WAKEUP")
          handler.reply("TEXT", this.translate("ScreenPowerOn"))
          return
        }
        if (args[0] == "off") {
          this.sendSocketNotification("FORCE_END")
          handler.reply("TEXT", this.translate("ScreenPowerOff"))
          return
        }
      }
      handler.reply("TEXT", 'Need Help for /screen commands ?\n\n\
  *on*: Power on the screen\n\
  *off*: Power off the screen\n\
  ',{parse_mode:'Markdown'})
    }
});
