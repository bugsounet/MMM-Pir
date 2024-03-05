/** PIR library **/
/** bugsounet **/

var log = (...args) => { /* do nothing */ };
const { PythonShell } = require("python-shell");

class PIR {
  constructor (config, callback) {
    this.config = config;
    this.callback = callback;
    this.default = {
      debug: false,
      gpio: 21
    };
    this.config = Object.assign({}, this.default, this.config);
    if (this.config.debug) log = (...args) => { console.log("[MMM-Pir] [LIB] [PIR]", ...args); };
    this.pir = null;
    this.running = false;
  }

  start () {
    if (this.running) return;
    if (this.config.gpio === 0) return console.log("[MMM-Pir] [LIB] [PIR] Disabled.");
    log("Start");
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
      if (err) console.error("[MMM-Pir] [LIB] [PIR] [PYTHON]",err);
      console.warn(`[MMM-Pir] [LIB] [PIR] [PYTHON] The exit code was: ${code}`);
      console.warn(`[MMM-Pir] [LIB] [PIR] [PYTHON] The exit signal was: ${signal}`);
    });
  }

  stop () {
    if (!this.running || (this.config.gpio === 0)) return;
    this.pir.kill();
    this.pir = null;
    this.running = false;
    this.callback("PIR_STOP");
    log("Stop");
  }
}

module.exports = PIR;
