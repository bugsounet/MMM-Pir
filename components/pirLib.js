/** PIR library **/
/** bugsounet **/

var log = (...args) => { /* do nothing */ };

class PIR {
  constructor (config, callback) {
    this.config = config;
    this.callback = callback;
    this.default = {
      debug: false,
      gpio: 21,
      mode: 0
    };
    this.config = Object.assign({}, this.default, this.config);
    if (this.config.debug) log = (...args) => { console.log("[MMM-Pir] [LIB] [PIR]", ...args); };
    this.pir = null;
    this.running = false;
    this.pirChip = null;
    this.pirLine = null;
    this.pirChipNumber = -1;
  }

  start () {
    if (this.running) return;
    if (this.config.gpio === 0) return console.log("[MMM-Pir] [LIB] [PIR] Disabled.");
    switch (this.config.mode) {
      case 0:
        console.log("[MMM-Pir] [LIB] [PIR] Mode 0 Selected (onoff library)");
        this.onoffDetect();
        break;
      case 1:
        console.log("[MMM-Pir] [LIB] [PIR] Mode 1 Selected (rpi.gpio)");
        this.gpioDetect();
        break;
      case 2:
        console.log("[MMM-Pir] [LIB] [PIR] Mode 2 Selected (gpiozero)");
        this.gpiozeroDetect();
        break;
      case 3:
        console.log("[MMM-Pir] [LIB] [PIR] Mode 3 Selected (gpiod library)");
        this.gpiodDetect();
        break;
      default:
        console.warn(`[MMM-Pir] [LIB] [PIR] mode: ${this.config.mode} is not a valid value`);
        console.warn("[MMM-Pir] [LIB] [PIR] set mode 0");
        this.config.mode = 0;
        this.onoffDetect();
        break;
    }
  }

  stop () {
    if (!this.running || (this.config.gpio === 0)) return;
    if (this.config.mode === 0) this.pir.unexport();
    else this.pir.kill();
    this.pir = null;
    this.running = false;
    this.callback("PIR_STOP");
    log("Stop");
  }

  onoffDetect () {
    try {
      const Gpio = require("onoff").Gpio;
      this.pir = new Gpio(this.config.gpio, "in", "both");
      this.callback("PIR_STARTED");
      console.log("[MMM-Pir] [LIB] [PIR] Started!");
    } catch (err) {
      console.error(`[MMM-Pir] [LIB] [PIR] ${err}`);
      this.running = false;
      return this.callback("PIR_ERROR", err.message);
    }
    this.running = true;
    this.pir.watch((err, value) => {
      if (err) {
        console.error(`[MMM-Pir] [LIB] [PIR] ${err}`);
        return this.callback("PIR_ERROR", err.message);
      }
      log(`Sensor read value: ${value}`);
      if (value === 1) {
        this.callback("PIR_DETECTED");
        log("Detected presence");
      }
    });
  }

  gpioDetect () {
    const { PythonShell } = require("python-shell");
    let options = {
      mode: "text",
      scriptPath: __dirname,
      pythonOptions: ["-u"],
      args: [ "-g", this.config.gpio ]
    };

    this.pir = new PythonShell("gpioSensor.py", options);
    this.callback("PIR_STARTED");
    console.log("[MMM-Pir] [LIB] [PIR] Started!");
    this.running = true;

    this.pir.on("message", (message) => {
      // detect pir
      if (message === "Detected") {
        log("Detected presence");
        this.callback("PIR_DETECTED");
      } else {
        console.error("[MMM-Pir] [LIB] [PIR]", message);
        this.callback("PIR_ERROR", message);
        this.running = false;
      }
    });

    this.pir.on("stderr", (stderr) => {
      // handle stderr (a line of text from stderr)
      if (this.config.debug) console.error("[MMM-Pir] [LIB] [PIR]", stderr);
      this.running = false;
    });

    this.pir.end((err,code,signal) => {
      if (err) {
        console.error("[MMM-Pir] [LIB] [PIR] [PYTHON]",err);
        this.callback("PIR_ERROR", err.message);
      }
      console.warn(`[MMM-Pir] [LIB] [PIR] [PYTHON] The exit code was: ${code}`);
      console.warn(`[MMM-Pir] [LIB] [PIR] [PYTHON] The exit signal was: ${signal}`);
    });
  }

  gpiozeroDetect () {
    const { PythonShell } = require("python-shell");
    let options = {
      mode: "text",
      scriptPath: __dirname,
      pythonOptions: ["-u"],
      args: [ "-g", this.config.gpio ]
    };

    this.pir = new PythonShell("MotionSensor.py", options);
    this.callback("PIR_STARTED");
    console.log("[MMM-Pir] [LIB] [PIR] Started!");
    this.running = true;

    this.pir.on("message", (message) => {
      // detect pir
      if (message === "Detected") {
        log("Detected presence");
        this.callback("PIR_DETECTED");
      } else {
        console.error("[MMM-Pir] [LIB] [PIR] ", message);
        this.callback("PIR_ERROR", message);
        this.running = false;
      }
    });

    this.pir.on("stderr", (stderr) => {
      // handle stderr (a line of text from stderr)
      if (this.config.debug) console.error("[MMM-Pir] [LIB] [PIR]", stderr);
      this.running = false;
    });

    this.pir.end((err,code,signal) => {
      if (err) {
        console.error("[MMM-Pir] [LIB] [PIR] [PYTHON]",err);
        this.callback("PIR_ERROR", err.message);
      }
      console.warn(`[MMM-Pir] [LIB] [PIR] [PYTHON] The exit code was: ${code}`);
      console.warn(`[MMM-Pir] [LIB] [PIR] [PYTHON] The exit signal was: ${signal}`);
    });
  }

  /* experimental */

  async gpiodDetect () {
    try {
      const { version, Chip, Line } = require("node-libgpiod");

      this.pirChipNumber = await this.ChipDetect();

      if (this.pirChipNumber === -1) {
        console.error("[MMM-Pir] [LIB] [PIR] [GPIOD] No Chip Found!");
        this.running = false;
        return;
      }

      this.pirChip = new Chip(this.pirChipNumber);
      this.pirLine = new Line(this.pirChip, this.config.gpio);
      this.pirLine.requestInputMode();
      this.callback("PIR_STARTED");
      console.log("[MMM-Pir] [LIB] [PIR] Started!");
    } catch (err) {
      if (this.pirLine) {
        this.pirLine.release();
        this.pirLine = null;
      }

      console.error(`[MMM-Pir] [LIB] [PIR] [GPIOD] ${err}`);
      this.running = false;
      return this.callback("PIR_ERROR", err.message);
    }

    this.running = true;

    this.pir = () => {
      var line = this.pirLine;
      if (this.running) {
        try {
          var value = line.getValue();
          if (value !== this.oldstate) {
            this.oldstate = value;
            log(`Sensor read value: ${value}`);
            if (value === 1) {
              this.callback("PIR_DETECTED");
              log("Detected presence");
            }
          }
        } catch (err) {
          console.error(`[MMM-Pir] [LIB] [PIR] [GPIOD] ${err}`);
          this.callback("PIR_ERROR", err);
        };
      }
    };
    setInterval(() => this.pir(), 1000);
  };

  ChipDetect () {
    const { version, Chip, Line } = require("node-libgpiod");
    return new Promise ((resolve) => {
      var chip = new Chip(0);
      if (chip.getChipLabel().includes("pinctrl-")) {
        console.log("[MMM-Pir] [LIB] [PIR] [GPIOD] Found chip 0");
        resolve(0);
      } else {
        chip = new Chip(3);
        if (chip.getChipLabel().includes("pinctrl-")) {
          console.log("[MMM-Pir] [LIB] [PIR] [GPIOD] Found chip 4");
          resolve(4);
        } else {
          resolve(-1);
        }
      }
    });
  }
}

module.exports = PIR;
