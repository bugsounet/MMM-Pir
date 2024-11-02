/** governor library **/
/** bugsounet **/

const exec = require("child_process").exec;

var log = (...args) => { /* do nothing */ };

class GOVERNOR {
  constructor (config,callback) {
    this.config = config;
    this.callback = callback;
    this.default = {
      debug: false,
      useCallback: false,
      sleeping: 4,
      working: 2
    };
    this.config = Object.assign(this.default, this.config);
    if (this.config.debug === true) log = (...args) => { console.log("[MMM-Pir] [LIB] [GOVERNOR]", ...args); };
    this.MyGovernor = [ "Disabled", "conservative", "ondemand" , "userspace" , "powersave" , "performance" ];
    this.Governor = {
      actived : false,
      wanted : "",
      actual : "",
      error: null
    };
    console.log("[MMM-Pir] [LIB] [GOVERNOR] Governor library initialized...");
  }

  start () {
    log("Start");
    this.working();
  }

  working () {
    this.Governor.wanted = this.checkGovernor(this.config.working, "working");
    if (this.Governor.wanted !== "Disabled") this.apply("working");
  }

  sleeping () {
    this.Governor.wanted = this.checkGovernor(this.config.sleeping, "sleeping");
    if (this.Governor.wanted !== "Disabled") this.apply("sleeping");
  }

  apply (type) {
    exec("cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor", (error, stdout, stderr) => {
      if (error) {
        this.Governor.actived= false;
        this.Governor.error= "Incompatible with your system.";
        console.error(`[MMM-Pir] [LIB] [GOVERNOR] ${type} - Error: Incompatible with your system.`);
        if (this.config.useCallback) this.callback(this.Governor);
        return;
      }
      this.Governor.actual = stdout.replace(/\n|\r|(\n\r)/g,"");
      log(`Actual: ${this.Governor.actual}`);
      if (this.Governor.actual === this.Governor.wanted) {
        this.Governor.error= null;
        this.Governor.actived = true;
        log("Already set");
        if (this.config.useCallback) this.callback(this.Governor);
      } else {
        this.MyGovernor.forEach((governor) => {
          if (governor === this.Governor.wanted) {
            exec(`echo ${governor} | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor`);
            this.Governor.error= null;
            this.Governor.actived = true;
            log(`${type} Set: ${governor}`);
            if (this.config.useCallback) this.callback(this.Governor);
          }
        });
        if (!this.Governor.actived) {
          console.error(`[MMM-Pir] [LIB] [GOVERNOR] ${type} Error: unknow Governor (${this.Governor.wanted})`);
          this.Governor.error= `Unknow Governor (${this.Governor.wanted})`;
          this.Governor.actived = false;
          if (this.config.useCallback) this.callback(this.Governor);
        }
      }
    });
  }

  checkGovernor (wanted, type) {
    let found = this.MyGovernor.find((governor, value) => {
      return value === wanted;
    });
    if (found) {
      log(`${type} Governor: ${found}`);
      return found;
    } else {
      console.error(`[MMM-Pir] [LIB] [GOVERNOR] ${type} Governor Error ! [${wanted}]`);
      return "Disabled";
    }
  }
}

module.exports = GOVERNOR;
