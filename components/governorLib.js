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
      sleeping: "powersave",
      working: "ondemand"
    };
    this.config = Object.assign(this.default, this.config);
    if (this.config.debug === true) log = (...args) => { console.log("[GOVERNOR]", ...args); };
    this.MyGovernor = [ "conservative", "ondemand" , "userspace" , "powersave" , "performance" ];
    this.Governor = {
      actived : false,
      wanted : "",
      actual : "",
      error: null
    };
    console.log("[GOVERNOR] Governor library initialized...");
  }
  start () {
    this.Governor.wanted = this.config.working;
    this.apply();
    log("Start");
  }

  working () {
    this.Governor.wanted = this.config.working;
    this.apply();
  }

  sleeping () {
    this.Governor.wanted = this.config.sleeping;
    this.apply();
  }

  apply () {
    exec("cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor", (error, stdout, stderr) => {
      if (error) {
        this.Governor.actived= false;
        this.Governor.error= "Incompatible with your system.";
        console.log("[GOVERNOR] Error: Incompatible with your system.");
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
            log(`Set: ${governor}`);
            if (this.config.useCallback) this.callback(this.Governor);
          }
        });
        if (!this.Governor.actived) {
          console.log(`[GOVERNOR] Error: unknow Governor (${this.Governor.wanted})`);
          this.Governor.error= `Unknow Governor (${this.Governor.wanted})`;
          this.Governor.actived = false;
          if (this.config.useCallback) this.callback(this.Governor);
        }
      }
    });
  }
}

module.exports = GOVERNOR;
