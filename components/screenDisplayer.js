/********************
* Screen displayer  *
* Bugsounet         *
*********************/
class screenDisplayer {
  constructor(config, Tools) {
    this.config = config
    this.translate = (...args) => Tools.translate(...args)
    this.bar = null
    this.init = null
    console.log("[MMM-Pir] screenDisplayer Ready")
  }

  prepare() {
    var dom = document.createElement("div")
    dom.id = "MMM-PIR"

    if (this.config.displayCounter || this.config.displayBar) {
      /** Screen TimeOut Text **/
      var screen = document.createElement("div")
      screen.id = "MMM-PIR_SCREEN"
      if (this.config.displayStyle != "Text" || !this.config.displayCounter) screen.className = "hidden"
      var screenText = document.createElement("div")
      screenText.id = "MMM-PIR_SCREEN_TEXT"
      screenText.textContent = this.translate("ScreenTurnOff")
      screenText.classList.add("bright")
      screen.appendChild(screenText)
      var screenCounter = document.createElement("div")
      screenCounter.id = "MMM-PIR_SCREEN_COUNTER"
      screenCounter.classList.add("bright")
      screenCounter.textContent = "--:--"
      screen.appendChild(screenCounter)

      /** Screen TimeOut Bar **/
      var bar = document.createElement("div")
      bar.id = "MMM-PIR_BAR"
      if ((this.config.displayStyle == "Text") || !this.config.displayBar) bar.className = "hidden"
      var screenBar = document.createElement("div")
      screenBar.id = "MMM-PIR_SCREEN_BAR"
      screenBar.classList.add(this.config.displayStyle)
      bar.appendChild(screenBar)
      dom.appendChild(screen)
      dom.appendChild(bar)
    }

    if (this.config.displayLastPresence) {
      /** Last user Presence **/
      var presence = document.createElement("div")
      presence.id = "MMM-PIR_PRESENCE"
      presence.className = "hidden"
      var presenceText = document.createElement("div")
      presenceText.id = "MMM-PIR_PRESENCE_TEXT"
      presenceText.textContent = this.translate("ScreenLastPresence")
      presence.appendChild(presenceText)
      var presenceDate = document.createElement("div")
      presenceDate.id = "MMM-PIR_PRESENCE_DATE"
      presenceDate.classList.add("presence")
      presenceDate.textContent = "Loading ..."
      presence.appendChild(presenceDate)
      dom.appendChild(presence)
    }
    return dom
  }

  prepareBar() {
    /** Prepare TimeOut Bar **/
    if ((this.config.displayStyle == "Text") || (!this.config.displayBar)) return
    this.bar = new ProgressBar[this.config.displayStyle](document.getElementById('MMM-PIR_SCREEN_BAR'), {
      strokeWidth: this.config.displayStyle == "Line" ? 2 : 5,
      trailColor: '#1B1B1B',
      trailWidth: 1,
      easing: 'linear',
      duration: 900,
      from: {color: '#FF0000'},
      to: {color: '#00FF00'},
      svgStyle: {
        display: 'block',
        width: '100%',
        'margin-bottom': '5px'
      },
      text: {
        style: {
          position: 'absolute',
          left: '50%',
          top: "50%",
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

  screenShowing() {
    MM.getModules().enumerate((module)=> {
      module.show(200, () => {}, {lockString: "MMM-PIR_LOCK"})
    })
    if (!this.init) return this.init = true
    _logPIR("Show All modules.")
  }

  screenHiding() {
    MM.getModules().enumerate((module)=> {
      module.hide(200, () => {}, {lockString: "MMM-PIR_LOCK"})
    })
    _logPIR("Hide All modules.")
  }

  checkStyle () {
    /** Crash prevent on Time Out Style Displaying **/
    /** --> Set to "Text" if not found */
    let Style = [ "Text", "Line", "SemiCircle", "Circle" ]
    let found = Style.find((style) => {
      return style == this.config.displayStyle
    })
    if (!found) {
      console.error(`[MMM-Pir] displayStyle Error ! [${this.config.displayStyle}]`)
      this.config.displayStyle = "Text"
    }
  }
}
