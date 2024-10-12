var log = (...args) => { /* do nothing */ };
var cron = require("node-cron");
var parser = require("cron-parser");

class cronJob {
  constructor (config, callback) {
    this.config = config;
    this.cronON = [];
    this.cronOFF = [];
    this.Manager = {
      mode: 0,
      ON: false,
      OFF: false,
      started: false
    };
    this.cronState = callback.cronState;

    if (this.config.debug) log = (...args) => { console.log("[MMM-Pir] [LIB] [CRON]", ...args); };
    log("Reading ON/OFF cron configuration...");

    switch (this.config.mode) {
      case 0:
        console.log("[MMM-Pir] [LIB] [CRON] [MODE] Disabled.");
        this.Manager.mode = 0;
        break;
      case 1:
        console.log("[MMM-Pir] [LIB] [CRON] [MODE] Add mode 1");
        this.Manager.mode = 1;
        break;
      case 2:
        console.log("[MMM-Pir] [LIB] [CRON] [MODE] Add mode 2");
        this.Manager.mode = 2;
        break;
      default:
        console.error(`[MMM-Pir] [LIB] [CRON] [MODE] Unknow Mode (${this.config.mode})`);
        this.Manager.mode = 0;
        break;
    }

    if (!this.Manager.mode) return;
    if (!this.config.ON) return console.warn("[MMM-Pir] [LIB] [CRON] ON feature not detected!");
    if (!this.config.OFF) return console.warn("[MMM-Pir] [LIB] [CRON] OFF feature not detected!");
    if (!Array.isArray(this.config.ON)) return console.error("[MMM-Pir] [LIB] [CRON] ON feature must be an Array");
    if (!Array.isArray(this.config.OFF)) return console.error("[MMM-Pir] [LIB] [CRON] OFF feature must be an Array");

    this.config.ON.forEach((ON) => {
      if (this.isObject(ON)) {
        this.checkCron(ON, "ON");
      } else {
        console.error("[MMM-Pir] [LIB] [CRON] [ON]", ON, "must be an object");
      }
    });

    if (!this.cronON.length) {
      console.log("[MMM-Pir] [LIB] [CRON] [ON] no cron defined");
    } else {
      log("[ON] Result:", this.cronON);
    }

    this.config.OFF.forEach((OFF) => {
      if (this.isObject(OFF)) {
        this.checkCron(OFF, "OFF");
      } else {
        console.error("[MMM-Pir] [LIB] [CRON] [OFF]", ON, "must be an object");
      }
    });
    if (!this.cronOFF.length) {
      console.log("[MMM-Pir] [LIB] [CRON] [OFF] no cron defined");
    } else {
      log("[OFF] Result:", this.cronOFF);
    }

  }

  checkCron (toCron, type) {
    var interval = parser.parseExpression("* * * * *");
    var fields = JSON.parse(JSON.stringify(interval.fields));
    console.log(`[MMM-Pir] [LIB] [CRON] [${type}] Configure:`, toCron);
    if (isNaN(toCron.hour)) return console.error(`[MMM-Pir] [LIB] [CRON] [${type}]`, toCron, "hour must be a number");
    fields.hour = [toCron.hour];
    if (isNaN(toCron.minute)) return console.error(`[MMM-Pir] [LIB] [CRON] [${type}]`, toCron, "minute must be a number");
    fields.minute = [toCron.minute];
    if (!Array.isArray(toCron.dayOfWeek)) return console.error(`[MMM-Pir] [LIB] [CRON] [${type}]`, toCron, "dayOfWeek must be a Array");
    fields.dayOfWeek = toCron.dayOfWeek;
    try {
      var modifiedInterval = parser.fieldsToExpression(fields);
      var job = modifiedInterval.stringify();
      log(`[${type}] PASSED --->`, job);
      if (type === "ON") this.cronON.push(job);
      else this.cronOFF.push(job);
      console.log(`[MMM-Pir] [LIB] [CRON] [${type}] Next`, type === "ON" ? "Start:": "Stop:", modifiedInterval.next().toString());
    } catch (e) {
      console.error(`[MMM-Pir] [LIB] [CRON] [${type}]`, toCron, e.toString());
    }
  }

  start () {
    if (!this.Manager.mode || (!this.cronON.length && !this.cronOFF.length)) return;
    if (!this.cronON.length && this.cronOFF.length) {
      console.error("[MMM-Pir] [LIB] [CRON] ON feature missing or failed!");
      return;
    }
    if (this.cronON.length && !this.cronOFF.length) {
      console.error("[MMM-Pir] [LIB] [CRON] OFF feature missing or failed!");
      return;
    }

    this.Manager.started= true;

    this.cronON.forEach((on) => {
      cron.schedule(on, () => {
        log("[ON] it's time to turn ON");
        this.Manager.ON= true;
        this.Manager.OFF= false;
        this.cronState(this.Manager);
      });
      log("[ON] Added:", on);
    });

    this.cronOFF.forEach((off) => {
      cron.schedule(off, () => {
        log("[OFF] it's time to turn OFF");
        this.Manager.ON= false;
        this.Manager.OFF= true;
        this.cronState(this.Manager);
      });
      log("[OFF] Added:", off);
    });

    this.cronState(this.Manager);
  }

  isObject (o) {
    return o !== null && typeof o === "object" && Array.isArray(o) === false;
  }
}

module.exports = cronJob;
