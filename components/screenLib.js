/********************
* Screen management *
* Bugsounet         *
*********************/

const exec = require("child_process").exec;
const process = require("process");
const path = require("path");
const moment = require("moment");

var log = (...args) => { /* do nothing */ };

class SCREEN {
  constructor (config, callback) {
    this.config = config;
    this.sendSocketNotification = callback;
    this.PathScript = `${path.dirname(require.resolve("../package.json"))}/scripts`;
    this.interval = null;
    this.default = {
      debug: false,
      timeout: 5 * 60 * 1000,
      mode: 1,
      availability: true,
      autoDimmer: false,
      xrandrForceRotation: "normal",
      wrandrForceRotation: "normal",
      wrandrForceMode: null
    };
    this.config = Object.assign({}, this.default, this.config);
    if (this.config.debug) log = (...args) => { console.log("[MMM-Pir] [LIB] [SCREEN]", ...args); };
    this.screen = {
      mode: this.config.mode,
      running: false,
      locked: false,
      power: false,
      xrandrRotation: null,
      wrandrRotation: null,
      wrandrForceMode: null,
      hdmiPort: null,
      forceOnStart: true,
      forceLocked: false,
      uptime: Math.floor(process.uptime()),
      availabilityCounter: Math.floor(process.uptime()),
      availabilityPercent: 0,
      availabilityTimeHuman: 0,
      availabilityTimeSec: 0,
      dimmerFrom: this.config.timeout / 4,
      output: {
        timer: "--:--",
        bar: 1,
        dimmer: 1,
        availabilityPercent: 100,
        availability: 0
      }
    };

    this.status = false;
    this.xrandrRoation = ["normal", "left", "right", "inverted"];
    this.wrandrRoation = ["normal", "90", "180", "270", "flipped", "flipped-90", "flipped-180", "flipped-270"];

    switch (this.config.mode) {
      case 0:
        console.log("[MMM-Pir] [LIB] [SCREEN] Mode 0: Disabled");
        break;
      case 1:
        console.log("[MMM-Pir] [LIB] [SCREEN] Mode 1: dpms rpi");
        break;
      case 2:
        if (this.xrandrRoation.indexOf(this.config.xrandrForceRotation) === -1) {
          console.error(`[MMM-Pir] [LIB] [SCREEN] Mode 2: xrandr invalid Rotation --> ${this.config.xrandrForceRotation}, Set to default: normal`);
          this.sendSocketNotification("SCREEN_ERROR", `Mode 2: xrandr invalid Rotation --> ${this.config.xrandrForceRotation}, Set to default: normal`);
          this.screen.xrandrRotation = "normal";
        } else {
          console.log(`[MMM-Pir] [LIB] [SCREEN] Mode 2: xrandr (primary display) -- Rotation: ${this.config.xrandrForceRotation}`);
          this.screen.xrandrRotation = this.config.xrandrForceRotation;
        }
        break;
      case 3:
        if (this.wrandrRoation.indexOf(this.config.wrandrForceRotation) === -1) {
          console.error(`[MMM-Pir] [LIB] [SCREEN] Mode 3: wlr-randr invalid Rotation --> ${this.config.wrandrForceRotation}, Set to default: normal`);
          this.sendSocketNotification("SCREEN_ERROR", `Mode 3: wlr-randr invalid Rotation --> ${this.config.wrandrForceRotation}, Set to default: normal`);
          this.screen.wrandrRotation = "normal";
        } else {
          console.log(`[MMM-Pir] [LIB] [SCREEN] Mode 3: wlr-randr (primary display) -- Rotation: ${this.config.wrandrForceRotation}`);
          this.screen.wrandrRotation = this.config.wrandrForceRotation;
        }
        if (this.config.wrandrForceMode) {
          console.log(`[MMM-Pir] [LIB] [SCREEN] Mode 10: wlr-randr -- ForceMode: ${this.config.wrandrForceMode}`);
          this.screen.wrandrForceMode = this.config.wrandrForceMode;
        }
        break;
      case 4:
        console.log("[MMM-Pir] [LIB] [SCREEN] Mode 4: HDMI CEC");
        break;
      case 5:
        console.log("[MMM-Pir] [LIB] [SCREEN] Mode 5: dpms linux");
        break;
      default:
        console.error(`[MMM-Pir] [LIB] [SCREEN] Unknow Mode (${this.config.mode}) Set to 0 (Disabled)`);
        this.sendSocketNotification("SCREEN_ERROR", `Unknow Mode (${this.config.mode}) Set to 0 (Disabled)`);
        this.config.mode = 0;
        break;
    }

    if (this.config.availability) {
      Number.prototype.toHHMMSS = function () {
        var sec_num = parseInt(this, 10); // don't forget the second param
        var hours   = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);

        if (hours   < 10) {hours   = `0${hours}`;}
        if (minutes < 10) {minutes = `0${minutes}`;}
        if (seconds < 10) {seconds = `0${seconds}`;}
        return `${hours}:${minutes}:${seconds}`;
      };
    }

    this.screenStatus();
  }

  activate () {
    process.on("exit", () => {
      if (this.config.mode) this.setPowerDisplay(true);
    });
    this.start();
  }

  start (restart) {
    if (this.screen.locked || this.screen.running) return;
    if (!restart) log("Start.");
    else log("Restart.");
    this.sendSocketNotification("SCREEN_PRESENCE", true);
    if (!this.screen.power) {
      if (this.config.mode) this.wantedPowerDisplay(true);
      this.sendSocketNotification("SCREEN_SHOWING");
      this.screen.power = true;
    }
    if (this.config.autoDimmer) {
      this.screen.output.dimmer = 1;
    }
    clearInterval(this.interval);
    this.interval = null;
    this.counter = this.config.timeout;
    this.interval = setInterval(() => {
      if (this.config.availability) {
        this.screen.uptime = Math.floor(process.uptime());
        this.screen.availabilityPercent = (this.screen.availabilityCounter*100)/this.screen.uptime;
        //this.screen.availabilityTimeSec = this.screen.uptime > 86400 ? (this.screen.availabilityPercent * 864) : this.screen.availabilityCounter;
        this.screen.availabilityTimeSec = this.screen.availabilityCounter;
        this.screen.availabilityTimeHuman = this.screen.availabilityTimeSec.toHHMMSS();
        this.screen.output.availabilityPercent = parseFloat(this.screen.availabilityPercent.toFixed(1));
        this.screen.output.availability = this.screen.availabilityTimeHuman;
      }
      this.screen.running = true;
      if (this.config.autoDimmer && (this.counter <= this.screen.dimmerFrom)) {
        this.screen.output.dimmer = 1 - ((this.screen.dimmerFrom - this.counter) / this.screen.dimmerFrom);
      }

      this.screen.output.timer = moment(new Date(this.counter)).format("mm:ss");
      this.screen.output.bar = (this.counter/this.config.timeout).toFixed(3);

      this.sendSocketNotification("SCREEN_OUTPUT", this.screen.output);

      if (this.counter <= 0) {
        clearInterval(this.interval);
        this.interval = null;
        this.screen.running = false;
        this.forceTurnOffScreen();
        log("Stops by counter.");
      }
      this.counter -= 1000;
    }, 1000);
  }

  forceTurnOffScreen () {
    if (!this.screen.power) return log("forceTurnOffScreen: already off");
    this.sendSocketNotification("SCREEN_HIDING");
    this.screen.power = false;
    if (this.config.mode) this.wantedPowerDisplay(false);
    this.sendSocketNotification("SCREEN_PRESENCE", false);
  }

  stop () {
    if (this.screen.locked) return;

    if (!this.screen.power) {
      if (this.config.mode) this.wantedPowerDisplay(true);
      this.sendSocketNotification("SCREEN_SHOWING");
      this.screen.power = true;
    }
    this.sendSocketNotification("SCREEN_PRESENCE", true);
    if (!this.screen.running) return;
    clearInterval(this.interval);
    this.interval = null;
    this.screen.running = false;
    log("Stops.");
  }

  reset () {
    if (this.screen.locked) return;
    clearInterval(this.interval);
    this.interval = null;
    this.screen.running = false;
    this.start(true);
  }

  wakeup () {
    if (this.screen.locked) return;
    this.reset();
  }

  lock () {
    if (this.screen.locked) return;
    this.screen.locked = true;
    clearInterval(this.interval);
    this.interval = null;
    this.screen.running = false;
    log("Locked !");
  }

  unlock () {
    if (this.screen.forceLocked) return log("Unlock: ForceLocked");
    this.screen.locked = false;
    log("Unlocked !");
    this.start();
  }

  forceEnd () {
    clearInterval(this.interval);
    this.interval = null;
    this.screen.running = false;
    this.counter = 0;
    this.forceTurnOffScreen();
  }

  wantedPowerDisplay (wanted) {
    var actual = false;
    switch (this.config.mode) {
      case 0:
        /** disabled **/
        log("Disabled mode");
        break;
      case 1:
        /** dpms rpi**/
        actual = false;
        exec("DISPLAY=:0 xset q | grep Monitor", (err, stdout, stderr) => {
          if (err) {
            console.error(`[MMM-Pir] [LIB] [SCREEN] ${err}`);
            this.sendSocketNotification("SCREEN_ERROR", "dpms command error (mode: 1)");
          }
          else {
            let responseSh = stdout.trim();
            var displaySh = responseSh.split(" ")[2];
            if (displaySh === "On") actual = true;
            this.resultDisplay(actual, wanted);
          }
        });
        break;
      case 2:
        /** xrandr on primary display **/
        exec("xrandr | grep 'connected primary'",
          (err, stdout, stderr) => {
            if (err) {
              console.error(`[MMM-Pir] [LIB] [SCREEN] xrandr: ${err}`);
              this.sendSocketNotification("SCREEN_ERROR", "xrandr command error (mode: 2)");
            }
            else {
              let responseSh = stdout.trim();
              var power = "on";
              this.screen.hdmiPort = responseSh.split(" ")[0];
              if (responseSh.split(" ")[3] === "(normal") power = "off";
              if (power === "on") actual = true;
              log(`[MODE 9] Monitor on ${this.screen.hdmiPort} is ${power}`);
              this.resultDisplay(actual, wanted);
            }
          });
        break;
      case 3:
        /** wl-randr on primary display **/
        exec("WAYLAND_DISPLAY=wayland-1 wlr-randr | grep 'Enabled'",
          (err, stdout, stderr) => {
            if (err) {
              console.error(`[MMM-Pir] [LIB] [SCREEN] wlr-randr: ${err}`);
              this.sendSocketNotification("SCREEN_ERROR", "wlr-randr command error (mode: 3)");
            } else {
              let responseSh = stdout.trim();
              if (responseSh.split(" ")[1] === "yes") actual = true;
              exec("WAYLAND_DISPLAY=wayland-1 wlr-randr",
                (err, stdout, stderr) => {
                  if (err) {
                    console.error(`[MMM-Pir] [LIB] [SCREEN] wlr-randr: ${err}`);
                    this.sendSocketNotification("SCREEN_ERROR", "wlr-randr scan screen command error (mode: 3)");
                  } else {
                    let wResponse = stdout.trim();
                    this.screen.hdmiPort = wResponse.split(" ")[0];
                    log(`[MODE 3] Monitor on ${this.screen.hdmiPort} is ${actual}`);
                    this.resultDisplay(actual, wanted);
                  }
                });
            }
          });
        break;
      case 4:
        /** CEC **/
        exec("echo 'pow 0' | cec-client -s -d 1", (err, stdout, stderr) => {
          if (err) {
            console.error(`[MMM-Pir] [LIB] [SCREEN] ${err}`);
            console.error(`[MMM-Pir] [LIB] [SCREEN] HDMI CEC Error: ${stdout}`);
            this.sendSocketNotification("SCREEN_ERROR", "HDMI CEC command error (mode: 4)");
          } else {
            let responseSh = stdout.trim();
            var displaySh = responseSh.split("\n")[1].split(" ")[2];
            if (displaySh === "on") actual = true;
            if (displaySh === "unknown") log("HDMI CEC unknow state");
            this.resultDisplay(actual, wanted);
          }
        });
        break;
      case 5:
        /** dmps linux **/
        exec("xset q | grep Monitor", (err, stdout, stderr) => {
          if (err) {
            console.error(`[MMM-Pir] [LIB] [SCREEN] [Display Error] dpms linux: ${err}`);
            this.sendSocketNotification("SCREEN_ERROR", "dpms linux command error (mode: 5)");
          }
          else {
            let responseSh = stdout.trim();
            var displaySh = responseSh.split(" ")[2];
            if (displaySh === "On") actual = true;
            this.resultDisplay(actual, wanted);
          }
        });
        break;
    }
  }

  resultDisplay (actual, wanted) {
    if (this.screen.forceOnStart) {
      log("Display: Force On Start");
      this.setPowerDisplay(true);
      this.screen.forceOnStart = false;
    } else {
      log(`Display -- Actual: ${actual} - Wanted: ${wanted}`);
      this.screen.power = actual;
      if (actual && !wanted) this.setPowerDisplay(false);
      if (!actual && wanted) this.setPowerDisplay(true);
    }
  }

  setPowerDisplay (set) {
    log(`Display ${set ? "ON." : "OFF."}`);
    this.screen.power = set;
    // and finally apply rules !
    switch (this.config.mode) {
      case 1:
        if (set) {
          exec("DISPLAY=:0 xset dpms force on", (err, stdout, stderr) => {
            if (err) {
              console.error(`[MMM-Pir] [LIB] [SCREEN] mode 1, power ON: ${err}`);
              this.sendSocketNotification("SCREEN_ERROR", "dpms command error (mode 1 power ON) ");
            }
          });
        } else {
          exec("DISPLAY=:0 xset dpms force off", (err, stdout, stderr) => {
            if (err) {
              console.error(`[MMM-Pir] [LIB] [SCREEN] mode 1, power OFF: ${err}`);
              this.sendSocketNotification("SCREEN_ERROR", "dpms command error (mode 1 power OFF)");
            }
          });
        }
        break;
      case 2:
        if (set) {
          exec(`xrandr --output ${this.screen.hdmiPort} --auto --rotate ${this.screen.xrandrRotation}`, (err, stdout, stderr) => {
            if (err) {
              console.error(`[MMM-Pir] [LIB] [SCREEN] mode 2, power ON: ${err}`);
              this.sendSocketNotification("SCREEN_ERROR", "xrandr command error (mode 2 power ON)");
            }
          });
        } else {
          exec(`xrandr --output ${this.screen.hdmiPort} --off`, (err, stdout, stderr) => {
            if (err) {
              console.error(`[MMM-Pir] [LIB] [SCREEN] mode 2, power OFF: ${err}`);
              this.sendSocketNotification("SCREEN_ERROR", "xrandr command error (mode 2 power OFF)");
            }
          });
        }
        break;
      case 3:
        if (set) {
          let wrandrOptions = [
            "--output",
            this.screen.hdmiPort,
            "--on",
            "--transform",
            this.screen.wrandrRotation
          ];
          if (this.screen.wrandrForceMode) wrandrOptions.push("--mode", this.screen.wrandrForceMode);
          wrandrOptions = wrandrOptions.join(" ");
          exec(`WAYLAND_DISPLAY=wayland-1 wlr-randr ${wrandrOptions}`, (err, stdout, stderr) => {
            if (err) {
              console.error(`[MMM-Pir] [LIB] [SCREEN] mode 3, power ON: ${err}`);
              this.sendSocketNotification("SCREEN_ERROR", "wlr-randr command error (mode 3 power ON)");
            }
          });
        }
        else {
          exec(`WAYLAND_DISPLAY=wayland-1 wlr-randr --output ${this.screen.hdmiPort} --off`, (err, stdout, stderr) => {
            if (err) {
              console.error(`[MMM-Pir] [LIB] [SCREEN] mode 3, power OFF: ${err}`);
              this.sendSocketNotification("SCREEN_ERROR", "wlr-randr command error (mode 3 power OFF)");
            }
          });
        }
        break;
      case 4:
        if (set) {
          exec("echo 'on 0' | cec-client -s", (err, stdout, stderr) => {
            if (err) {
              console.error(`[MMM-Pir] [LIB] [SCREEN] mode 4, power ON: ${err}`);
              this.sendSocketNotification("SCREEN_ERROR", "HDMI CEC command error (mode 4 power ON)");
            }
          });
        } else {
          exec("echo 'standby 0' | cec-client -s", (err, stdout, stderr) => {
            if (err) {
              console.error(`[MMM-Pir] [LIB] [SCREEN] mode 4, power OFF: ${err}`);
              this.sendSocketNotification("SCREEN_ERROR", "HDMI CEC command error (mode 4 power OFF)");
            }
          });
        }
        break;
      case 5:
        if (set) {
          exec("xset dpms force on", (err, stdout, stderr) => {
            if (err) {
              console.error(`[MMM-Pir] [LIB] [SCREEN] mode 5, power ON: ${err}`);
              this.sendSocketNotification("SCREEN_ERROR", "dpms linux command error (mode 5 power ON)");
            }
          });
        } else {
          exec("xset dpms force off", (err, stdout, stderr) => {
            if (err) {
              console.error(`[MMM-Pir] [LIB] [SCREEN] mode 5, power OFF: ${err}`);
              this.sendSocketNotification("SCREEN_ERROR", "dpms linux command error (mode 5 power OFF)");
            }
          });
        }
        break;
    }
  }

  state () {
    this.sendSocketNotification("SCREEN_STATE", this.screen);
  }

  /** Force Lock ON/OFF display **/
  forceLockOFF () {
    if (!this.screen.power) return log("[Force OFF] Display Already OFF");
    this.sendForceLockState(true);
    this.screen.locked = true;
    clearInterval(this.interval);
    this.interval = null;
    if (this.screen.running) this.counter = 0;
    this.screen.running = false;
    this.forceTurnOffScreen();
    this.sendSocketNotification("SCREEN_OUTPUT", { timer: "00:00", bar: 0 });
    log("[Force OFF] Turn OFF Display");
  }

  forceLockON () {
    if (this.screen.locked && !this.screen.forceLocked) return log("[Force ON] Display is Locked!");
    this.sendForceLockState(false);
    this.screen.locked = false;
    this.wakeup();
    log("[Force ON] Turn ON Display");
  }

  sendForceLockState (state) {
    this.screen.forceLocked = state;
  }

  screenStatus () {
    setInterval(() => {
      if (this.screen.power && this.config.availability) this.screen.availabilityCounter++;
      let status = this.screen.power;
      if (status !== this.status) {
        this.sendSocketNotification("SCREEN_POWERSTATUS", status);
        log("[POWER] Display from", this.status, "--->", status);
      }
      this.status = status;
    }, 1000);
  }
}

module.exports = SCREEN;
