class screenDisplayer {
  constructor(that) {
    this.config = that.config
    this.translate = (...args) => that.translate(...args)
    this.bar = null
    this.init = null
    console.log("[SCREEN] screenDisplayer Ready")
  }

  prepare() {
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
  }

  prepareBar() {
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
  }

  barAnimate(payload) {
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

  prepareBody() {
    document.body.id = "EXT_SCREEN_ANIMATE"
    document.body.className= "animate__animated"
    document.body.style.setProperty('--animate-duration', '1s')
  }

  screenShowing() {
    MM.getModules().enumerate((module)=> {
      module.show(500, {lockString: "EXT-SCREEN_LOCK"})
    })
    if (!this.init) return this.init = true
    if (this.config.animateBody) {
      document.body.classList.remove("animate__zoomOut")
      document.body.style.animationFillMode = "inherit"
      document.body.classList.add("animate__zoomIn")
    }
    logScreen("Show All modules.")
  }

  screenHiding() {
    if (this.config.animateBody) {
      document.body.classList.remove("animate__zoomIn")
      document.body.style.animationFillMode = "both"
      document.body.classList.add("animate__zoomOut")
      document.body.addEventListener('animationend', (e) => {
        if (e.animationName == "zoomOut") {
          MM.getModules().enumerate((module)=> {
            module.hide(1000, {lockString: "EXT-SCREEN_LOCK"})
          })
        }
        e.stopPropagation()
      }, {once: true})
    } else {
      MM.getModules().enumerate((module)=> {
        module.hide(1000, {lockString: "EXT-SCREEN_LOCK"})
      })
    }
    logScreen("Hide All modules.")
  }

  /** Hide EXT with Flip animation **/
  hideDivWithAnimatedFlip (div) {
    if (!this.config.autoHide) return
    var module = document.getElementById(div)
    module.classList.remove("animate__flipInX")
    module.classList.add("animate__flipOutX")
    module.addEventListener('animationend', (e) => {
      if (e.animationName == "flipOutX") {
        module.classList.add("hidden")
      }
      e.stopPropagation()
    }, {once: true})
  }

  showDivWithAnimatedFlip (div) {
    if (!this.config.autoHide) return
    var module = document.getElementById(div)
    module.classList.remove("animate__flipOutX", "hidden")
    module.classList.add("animate__flipInX")
  }

  checkStyle () {
    /** Crash prevent on Time Out Style Displaying **/
    /** --> Set to "Text" if not found */
    let Style = [ "Text", "Line", "SemiCircle", "Circle" ]
    let found = Style.find((style) => {
      return style == this.config.displayStyle
    })
    if (!found) {
      console.error("[SCREEN] displayStyle Error ! ["+ this.config.displayStyle + "]")
      this.config.displayStyle = "Text"
    }
  }
}
