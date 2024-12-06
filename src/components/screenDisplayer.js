/********************
* Screen displayer  *
* Bugsounet         *
*********************/

/* global ProgressBar, _logPIR */
/* eslint-disable-next-line */
class screenDisplayer {
  constructor (config, Tools) {
    this.config = config;
    this.translate = (...args) => Tools.translate(...args);
    this.hide = (...args) => Tools.hide(...args);
    this.show = (...args) => Tools.show(...args);
    this.hidden = () => Tools.hidden();
    this.default = {
      animate: true,
      colorFrom: "#FF0000",
      colorTo: "#00FF00",
      counter: true,
      style: 1,
      lastPresence: true,
      lastPresenceTimeFormat: "LL H:mm",
      availability: true,
      autoDimmer: false,
      timeout: 2 * 60 * 1000
    };
    this.config = Object.assign({}, this.default, this.config);
    this.bar = null;
    this.init = null;
    this.style = "Text";
    this.checkStyle();
    this.colorFrom = "#FF0000";
    this.colorTo = "#00FF00";
    this.userPresence = null;
    this.lastPresence = null;
    this.checkColor();
    console.log("[MMM-Pir] screenDisplayer Ready");
  }

  prepareDom () {
    var dom = document.createElement("div");
    dom.id = "MMM-PIR";

    if (this.style === "Text" && this.config.counter) {
      // Screen TimeOut with Text
      var screen = document.createElement("div");
      screen.id = "MMM-PIR_TEXT";
      var screenText = document.createElement("div");
      screenText.id = "MMM-PIR_TEXT_TRANSLATE";
      screenText.textContent = this.translate("ScreenTurnOff");
      screenText.classList.add("bright");
      screen.appendChild(screenText);

      var screenCounter = document.createElement("div");
      screenCounter.id = "MMM-PIR_TEXT_COUNTER";
      screenCounter.classList.add("bright");
      screenCounter.textContent = "--:--";
      screen.appendChild(screenCounter);

      dom.appendChild(screen);
    } else {
      if (this.style !== "None") {
        // Screen TimeOut with Style
        var screenStyle = document.createElement("div");
        screenStyle.id = "MMM-PIR_STYLE";
        screenStyle.classList.add(this.style);

        dom.appendChild(screenStyle);
      }
    }

    if (this.config.lastPresence) {
      // Last user Presence
      var presence = document.createElement("div");
      presence.id = "MMM-PIR_PRESENCE";
      presence.className = "hidden";
      var presenceText = document.createElement("div");
      presenceText.id = "MMM-PIR_PRESENCE_TEXT";
      presenceText.textContent = this.translate("ScreenLastPresence");
      presence.appendChild(presenceText);
      var presenceDate = document.createElement("div");
      presenceDate.id = "MMM-PIR_PRESENCE_DATE";
      presenceDate.classList.add("presence");
      presenceDate.textContent = "Unknow";
      presence.appendChild(presenceDate);
      dom.appendChild(presence);
    }

    if (this.config.availability) {
      // availability of the screen
      var availability = document.createElement("div");
      availability.id = "MMM-PIR_AVAILABILITY";
      availability.classList.add("bright");
      var availabilityText = document.createElement("div");
      availabilityText.id = "MMM-PIR_AVAILABILITY_TEXT";
      availabilityText.textContent = this.translate("ScreenAvailability");
      availability.appendChild(availabilityText);
      var availabilityValue = document.createElement("div");
      availabilityValue.id = "MMM-PIR_AVAILABILITY_DATA";
      availabilityValue.classList.add("availability");
      availabilityValue.textContent = "--:--:-- (---%)";
      availability.appendChild(availabilityValue);
      dom.appendChild(availability);
    }
    return dom;
  }

  prepareStyle () {
    // Prepare TimeOut with Style
    if (this.style === "Text" || this.style === "None") return;
    this.bar = new ProgressBar[this.style](document.getElementById("MMM-PIR_STYLE"), {
      strokeWidth: this.style === "Line" ? 2 : 5,
      trailColor: "#1B1B1B",
      trailWidth: 1,
      easing: "bounce",
      duration: 900,
      from: { color: this.colorFrom },
      to: { color: this.colorTo },
      svgStyle: {
        display: "block",
        width: "100%",
        "margin-bottom": "5px"
      },
      text: {
        style: {
          position: "absolute",
          left: "50%",
          top: "50%",
          padding: 0,
          margin: 0,
          transform: {
            prefix: true,
            value: "translate(-50%, -50%)"
          }
        }
      }
    });
  }

  updateDisplay (payload) {
    if (this.config.availability && payload.availability) {
      let availability = document.getElementById("MMM-PIR_AVAILABILITY_DATA");
      availability.textContent = `${payload.availability} (${payload.availabilityPercent}%)`;
    }
    if (this.config.autoDimmer && payload.dimmer) {
      this.opacityRegions(payload.dimmer);
    }
    if (this.style === "None") return;
    if (this.style === "Text") {
      if (this.config.counter) {
        let counter = document.getElementById("MMM-PIR_TEXT_COUNTER");
        counter.textContent = payload.timer;
      }
    } else {
      this.barAnimate(payload);
    }
  }

  barAnimate (payload) {
    let value = payload.bar;
    let timeOut = this.config.counter ? payload.timer : "";
    this.bar.animate(value, {
      step: (state, bar) => {
        bar.path.setAttribute("stroke", state.color);
        bar.setText(timeOut);
        bar.text.style.color = state.color;
      }
    });
  }

  updatePresence (payload) {
    if (!this.config.lastPresence) return;
    if (payload) this.lastPresence = moment().format(this.config.lastPresenceTimeFormat);
    else this.userPresence = this.lastPresence;
    if (this.userPresence) {
      let presence = document.getElementById("MMM-PIR_PRESENCE");
      presence.classList.remove("hidden");
      presence.classList.add("bright");
      let userPresence = document.getElementById("MMM-PIR_PRESENCE_DATE");
      userPresence.textContent = this.userPresence;
    }
  }

  screenShowing () {
    if (!this.init) return this.init = true;
    MM.getModules().enumerate((module) => {
      let speed = 200;
      let options = { lockString: "MMM-PIR_LOCK" };
      if (this.config.animate && module.data.position) {
        options.animate = this.animateFromPosition(module.data.position, true);
        speed = 500;
      }
      module.show(speed, () => {}, options);
    });
    _logPIR("Show All modules.");
  }

  screenHiding () {
    MM.getModules().enumerate((module) => {
      let options = { lockString: "MMM-PIR_LOCK" };
      if (this.config.animate && module.data.position) {
        options.animate = this.animateFromPosition(module.data.position, false);
      }
      module.hide(500, () => {}, options);
    });
    _logPIR("Hide All modules.");
  }

  /** Hide with Flip animation **/
  hideMe () {
    if (this.hidden()) return _logPIR("Already Hidden.");
    this.hide(1000, () => {}, { lockString: "MMM-PIR_LOCK", animate: "flipOutX" });
  }

  showMe () {
    if (!this.hidden()) return _logPIR("Already Showing.");
    this.show(1000, () => {}, { lockString: "MMM-PIR_LOCK", animate: "flipInX" });
  }

  animateFromPosition (position, show) {
    let animateShow = {
      fullscreen_below: "FadeIn",
      top_bar: "backInDown",
      top_left: "backInLeft",
      top_center: "backInDown",
      top_right: "backInRight",
      upper_third: "zoomIn",
      middle_center: "zoomIn",
      lower_third: "zoomIn",
      bottom_bar: "backInUp",
      bottom_left: "backInLeft",
      bottom_center: "backInUp",
      bottom_right: "backInRight",
      fullscreen_above: "FadeIn"
    };
    let animateHide = {
      fullscreen_below: "FadeOut",
      top_bar: "backOutUp",
      top_left: "backOutLeft",
      top_center: "backOutUp",
      top_right: "backOutRight",
      upper_third: "zoomOut",
      middle_center: "zoomOut",
      lower_third: "zoomOut",
      bottom_bar: "backOutDown",
      bottom_left: "backOutLeft",
      bottom_center: "backOutDown",
      bottom_right: "backOutRight",
      fullscreen_above: "FadeOut"
    };
    if (show) return animateShow[position];
    else return animateHide[position];
  }

  checkStyle () {
    // Crash prevent on Time Out Style Displaying
    // --> Set to "Text" if not found
    let Style = ["None", "Text", "Line", "SemiCircle", "Circle"];
    let found = Style.find((style, value) => {
      return value === this.config.style;
    });
    if (found) {
      this.style = found;
      console.log(`[MMM-Pir] Display.style: ${this.style}`);
    } else {
      console.error(`[MMM-Pir] Display.style Error ! [${this.config.style}]`);
      this.style = "Text";
    }
  }

  checkColor () {
    // check valid HEXA color
    if (this.style === "Text" || this.style === "None") return;
    let from = CSS.supports("color", this.config.colorFrom) && this.config.colorFrom.startsWith("#");
    if (from) this.colorFrom = this.config.colorFrom;
    let to = CSS.supports("color", this.config.colorTo) && this.config.colorTo.startsWith("#");
    if (to) this.colorTo = this.config.colorTo;
  }

  opacityRegions (dimmer) {
    var regions = document.querySelectorAll(".region");
    regions.forEach((region) => {
      region.style.opacity = dimmer;
    });
  }

  animateModule () {
    let animation = document.getElementById("MMM-PIR");
    animation.classList.add("animate__animated", "animate__headShake");
    animation.style.setProperty("--animate-duration", ".5s");
    setTimeout(() => {
      animation.classList.remove("animate__animated", "animate__headShake");
    }, 500);
  }
}
