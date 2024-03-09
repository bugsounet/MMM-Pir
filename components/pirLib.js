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
    console.log("[MMM-Pir] [LIB] [PIR] Started in MODE 1!");
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
      if (err) console.error("[MMM-Pir] [LIB] [PIR] [PYTHON - 1]",err);
      console.warn(`[MMM-Pir] [LIB] [PIR] [PYTHON] The exit code was: ${code}`);
      console.warn(`[MMM-Pir] [LIB] [PIR] [PYTHON] The exit signal was: ${signal}`);
    });
  }

  onoffDetect () {
    try {
      const Gpio = require("onoff").Gpio;
      this.pir = new Gpio(this.config.gpio, "in", "both");
      this.callback("PIR_STARTED");
      console.log("[MMM-Pir] [LIB] [PIR] Started in MODE 0!");
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
        log(`Detected presence (value: ${value})`);
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
    console.log("[MMM-Pir] [LIB] [PIR] Started in MODE 2!");
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
      if (err) console.error("[MMM-Pir] [LIB] [PIR] [PYTHON - 2]",err);
      console.warn(`[MMM-Pir] [LIB] [PIR] [PYTHON] The exit code was: ${code}`);
      console.warn(`[MMM-Pir] [LIB] [PIR] [PYTHON] The exit signal was: ${signal}`);
    });
  }
}

module.exports = PIR;
