/*******************
*  EXT-Screen v1.1 *
*  Bugsounet       *
*  03/2022         *
*******************/

Module.register("EXT-Screen", {
    requiresVersion: "2.18.0",
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
      sound: true
    },

    start: function () {
      mylog_ = function() {
        var context = "[SCREEN]"
        return Function.prototype.bind.call(console.log, console, context)
      }()

      mylog = function() {
        //do nothing
      }

      if (this.config.debug) mylog = mylog_
      this.config.governorSleeping= true
      this.sendSocketNotification("INIT", this.config)
      this.checkStyle()
      this.userPresence = null
      this.lastPresence = null
      this.init = null
      this.awaitBeforeTurnOnTimer= null
      mylog("is now started!")
    },

    socketNotificationReceived: function (notification, payload) {
      switch(notification) {
        case "SCREEN_SHOWING":
          this.screenShowing()
          break
        case "SCREEN_HIDING":
          this.screenHiding()
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
            let value = (100 - ((payload * 100) / this.config.delay))/100
            let timeOut = moment(new Date(this.config.delay-payload)).format("m:ss")
            this.bar.animate(value, {
              step: (state, bar) => {
                bar.path.setAttribute('stroke', state.color)
                bar.setText(this.config.displayCounter ? timeOut : "")
                bar.text.style.color = state.color
              }
            })
          }
          break
        case "SCREEN_PRESENCE":
          this.sendNotification("USER_PRESENCE", payload ? true : false)
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
      switch(notification) {
        case "DOM_OBJECTS_CREATED":
          if (this.config.animateBody) this.prepareBody()
          this.prepareBar()
          break
        case "GAv4_READY":
          if (sender.name == "MMM-GoogleAssistant") this.sendNotification("EXT_HELLO", this.name)
          break
        case "USER_PRESENCE":
          if (payload == true) this.sendSocketNotification("WAKEUP")
          else this.sendSocketNotification("FORCE_END")
          break
        case "EXT_SCREEN-END":
          this.sendSocketNotification("FORCE_END")
          break
        case "EXT_SCREEN-WAKEUP":
          this.sendSocketNotification("WAKEUP")
          if (sender.name == "Gateway" ||
            sender.name == "EXT-Pir" ||
            sender.name == "EXT-ScreenManager" ||
            sender.name == "EXT-ScreenTouch"
          ) return
          this.sendNotification("EXT_ALERT", {
            message: this.translate("ScreenWakeUp", { VALUES: sender.name }),
            type: "information",
          })
          break
        case "EXT_SCREEN-LOCK":
          this.sendSocketNotification("LOCK")
          let HiddenLock = true
          if (payload && payload.show) HiddenLock= false
          if (HiddenLock) this.hideDivWithAnimatedFlip("EXT-SCREEN")
          if (sender.name == "Gateway" ||
            sender.name == "EXT-Pir" ||
            sender.name == "EXT-ScreenManager" ||
            sender.name == "EXT-ScreenTouch"
          ) return
          this.sendNotification("EXT_ALERT", {
            message: this.translate("ScreenLock", { VALUES: sender.name }),
            type: "information"
          })
          break
        case "EXT_SCREEN-FORCE_LOCK":
          this.sendSocketNotification("FORCELOCK")
          this.hideDivWithAnimatedFlip("EXT-SCREEN")
          if (sender.name == "Gateway" ||
            sender.name == "EXT-Pir" ||
            sender.name == "EXT-ScreenManager" ||
            sender.name == "EXT-ScreenTouch"
          ) return
          this.sendNotification("EXT_ALERT", {
            message: this.translate("ScreenLock", { VALUES: sender.name }),
            type: "information",
          })
          break
        case "EXT_SCREEN-UNLOCK":
          this.sendSocketNotification("UNLOCK")
          let HiddenUnLock = true
          if (payload && payload.show) HiddenUnLock= false
          if (HiddenUnLock) this.showDivWithAnimatedFlip("EXT-SCREEN")
          if (sender.name == "Gateway" ||
            sender.name == "EXT-Pir" ||
            sender.name == "EXT-ScreenManager" ||
            sender.name == "EXT-ScreenTouch"
          ) return
          this.sendNotification("EXT_ALERT", {
            message: this.translate("ScreenUnLock", { VALUES: sender.name }),
            type: "information",
          })
          break
        case "EXT_SCREEN-FORCE_UNLOCK":
          this.sendSocketNotification("FORCEUNLOCK")
          this.showDivWithAnimatedFlip("EXT-SCREEN")
          if (sender.name == "Gateway" ||
            sender.name == "EXT-Pir" ||
            sender.name == "EXT-ScreenManager" ||
            sender.name == "EXT-ScreenTouch"
          ) return
          this.sendNotification("EXT_ALERT", {
            message: this.translate("ScreenUnLock", { VALUES: sender.name }),
            type: "information",
          })
          break
      }
    },

    getDom: function () {
      var dom = document.createElement("div")
      dom.id = "EXT-SCREEN"
      dom.className= "animate__animated"
      dom.style.setProperty('--animate-duration', '1s')

      if (this.config.displayCounter || this.config.displayBar) {
        /** Screen TimeOut Text **/
        var screen = document.createElement("div")
        screen.id = "EXT-SCREEN_SCREEN"
        if (this.config.displayStyle != "Text" || !this.config.displayCounter) screen.className = "hidden"
        var screenText = document.createElement("div")
        screenText.id = "EXT-SCREEN_SCREEN_TEXT"
        screenText.textContent = this.translate("ScreenTurnOff")
        screenText.classList.add("bright")
        screen.appendChild(screenText)
        var screenCounter = document.createElement("div")
        screenCounter.id = "EXT-SCREEN_SCREEN_COUNTER"
        screenCounter.classList.add("bright")
        screenCounter.textContent = "--:--"
        screen.appendChild(screenCounter)

        /** Screen TimeOut Bar **/
        var bar = document.createElement("div")
        bar.id = "EXT-SCREEN_BAR"
        if ((this.config.displayStyle == "Text") || !this.config.displayBar) bar.className = "hidden"
        var screenBar = document.createElement(this.config.displayStyle == "Bar" ? "meter" : "div")
        screenBar.id = "EXT-SCREEN_SCREEN_BAR"
        screenBar.classList.add(this.config.displayStyle)
        if (this.config.displayStyle == "Bar") {
          screenBar.value = 0
          screenBar.max= this.config.delay
        }
        bar.appendChild(screenBar)
        dom.appendChild(screen)
        dom.appendChild(bar)
      }

      if (this.config.displayLastPresence) {
        /** Last user Presence **/
        var presence = document.createElement("div")
        presence.id = "EXT-SCREEN_PRESENCE"
        presence.className = "hidden"
        var presenceText = document.createElement("div")
        presenceText.id = "EXT-SCREEN_PRESENCE_TEXT"
        presenceText.textContent = this.translate("ScreenLastPresence")
        presence.appendChild(presenceText)
        var presenceDate = document.createElement("div")
        presenceDate.id = "EXT-SCREEN_PRESENCE_DATE"
        presenceDate.classList.add("presence")
        presenceDate.textContent = "Loading ..."
        presence.appendChild(presenceDate)
        dom.appendChild(presence)
      }
      return dom
    },

    getStyles: function () {
      return [
        "EXT-Screen.css",
        "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
      ]
    },

    getScripts: function () {
      return [
        "/modules/EXT-Screen/scripts/progressbar.js",
        "/modules/EXT-Screen/scripts/long-press-event.js"
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

    prepareBar: function () {
      /** Prepare TimeOut Bar **/
      if ((this.config.displayStyle == "Text") || (this.config.displayStyle == "Bar") || (!this.config.displayBar)) return
      this.bar = new ProgressBar[this.config.displayStyle](document.getElementById('EXT-SCREEN_SCREEN_BAR'), {
        strokeWidth: this.config.displayStyle == "Line" ? 2 : 5,
        trailColor: '#1B1B1B',
        trailWidth: 1,
        easing: 'easeInOut',
        duration: 500,
        svgStyle: null,
        from: {color: '#FF0000'},
        to: {color: '#00FF00'},
        text: {
          style: {
            position: 'absolute',
            left: '50%',
            top: this.config.displayStyle == "Line" ? "0" : "50%",
            padding: 0,
            margin: 0,
            transform: {
                prefix: true,
                value: 'translate(-50%, -50%)'
            }
          }
        }
      })
    },

    prepareBody: function () {
      document.body.id = "EXT_SCREEN_ANIMATE"
      document.body.className= "animate__animated"
      document.body.style.setProperty('--animate-duration', '1s')
    },

    screenShowing: function() {
      if (this.config.animateBody && this.init) {
        clearTimeout(this.awaitBeforeTurnOnTimer)
        this.awaitBeforeTurnOnTimer= null
        // don't execute rules ... to much time for wakeup screen ...
        //await this.awaitBeforeWakeUp(this.config.animateTime)
      }
      MM.getModules().enumerate((module)=> {
        module.show(500, {lockString: "EXT-SCREEN_LOCK"})
      })
      if (!this.init) return this.init = true
      if (this.config.animateBody) {
        document.body.classList.remove("animate__zoomOut")
        document.body.style.animationFillMode = "inherit"
        document.body.classList.add("animate__zoomIn")
      }
      mylog("Show All modules.")
    },

    screenHiding: function() {
      if (this.config.animateBody) {
        clearTimeout(this.awaitBeforeTurnOnTimer)
        this.awaitBeforeTurnOnTimer= null
        document.body.classList.remove("animate__zoomIn")
        document.body.style.animationFillMode = "both"
        document.body.classList.add("animate__zoomOut")
        document.body.addEventListener('animationend', (e) => {
          if (e.animationName == "zoomOut" && e.path[0].id == "EXT_SCREEN_ANIMATE") {
            MM.getModules().enumerate((module)=> {
              module.hide(1000, {lockString: "EXT-SCREEN_LOCK"})
            })
          }
        }, {once: false})
      } else {
        MM.getModules().enumerate((module)=> {
          module.hide(1000, {lockString: "EXT-SCREEN_LOCK"})
        })
      }
      mylog("Hide All modules.")
    },

    /** Hide EXT with Flip animation **/
    hideDivWithAnimatedFlip: function (div) {
      if (!this.config.autoHide) return
      var module = document.getElementById(div)
      module.classList.remove("animate__flipInX")
      module.classList.add("animate__flipOutX")
      module.addEventListener('animationend', (e) => {
        if (e.animationName == "flipOutX" && e.path[0].id == div) {
          module.classList.add("hidden")
        }
        e.stopPropagation()
      }, {once: true})
    },

    showDivWithAnimatedFlip: function (div) {
      if (!this.config.autoHide) return
      var module = document.getElementById(div)
      module.classList.remove("hidden")
      module.classList.remove("animate__flipOutX")
      module.classList.add("animate__flipInX")
    },

    /** need to sleep ? **/
    awaitBeforeWakeUp: function(ms=3000) {
      return new Promise((resolve) => {
        this.awaitBeforeTurnOnTimer = setTimeout(resolve, ms)
      })
    },

    checkStyle: function () {
      /** Crash prevent on Time Out Style Displaying **/
      /** --> Set to "Text" if not found */
      let Style = [ "Text", "Line", "SemiCircle", "Circle" ]
      let found = Style.find((style) => {
        return style == this.config.displayStyle
      })
      if (!found) {
        console.error("[Screen] displayStyle Error ! ["+ this.config.displayStyle + "]")
        this.config.displayStyle = "Text"
      }
    },

    getCommands: function(commander) {
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
