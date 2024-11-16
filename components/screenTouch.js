/**************
* screenTouch *
* Bugsounet   *
***************/

/* eslint-disable-next-line */
class screenTouch {
  constructor (Touch, Tools) {
    this.mode = Touch.mode;
    this.sendSocketNotification = (...args) => Tools.sendSocketNotification(...args);
    this.hidden = () => Tools.hidden();
    if (this.mode > 3 || this.mode < 0 || isNaN(this.mode)) this.mode = 3;
    this.clickTimer = null;
    this.clickCount = 0;
    console.log("[MMM-Pir] screenTouch Ready");
  }

  touch () {
    let TouchScreen = document.getElementById("MMM-PIR");

    switch (this.mode) {
      case 1:
        // mode 1
        window.addEventListener("click", () => {
          this.clickCount++;
          if (this.clickCount === 1) {
            this.clickTimer = setTimeout(() => {
              this.clickCount = 0;
              this.sendSocketNotification("LOCK_FORCE_WAKEUP");
            }, 400);
          } else if (this.clickCount === 2) {
            clearTimeout(this.clickTimer);
            this.clickCount = 0;
            this.sendSocketNotification("LOCK_FORCE_END");
          }
        }, false);
        break;
      case 2:
        // mode 2
        TouchScreen.addEventListener("click", () => {
          if (!this.hidden()) this.sendSocketNotification("LOCK_FORCE_WAKEUP");
        }, false);

        window.addEventListener("long-press", () => {
          if (this.hidden()) this.sendSocketNotification("LOCK_FORCE_WAKEUP");
          else {
            this.sendSocketNotification("LOCK_FORCE_END");
          }
        }, false);
        break;
      case 3:
        // mode 3
        TouchScreen.addEventListener("click", () => {
          this.clickCount++;
          if (this.clickCount === 1) {
            this.clickTimer = setTimeout(() => {
              this.clickCount = 0;
              this.sendSocketNotification("LOCK_FORCE_WAKEUP");
            }, 400);
          } else if (this.clickCount === 2) {
            clearTimeout(this.clickTimer);
            this.clickCount = 0;
            this.sendSocketNotification("LOCK_FORCE_END");
          }
        }, false);

        window.addEventListener("click", () => {
          if (this.hidden()) {
            clearTimeout(this.clickTimer);
            this.clickCount = 0;
            this.sendSocketNotification("LOCK_FORCE_WAKEUP");
          }
        }, false);
        break;
    }
    if (!this.mode) console.log("[MMM-Pir] Touch Screen Function disabled.");
    else console.log(`[MMM-Pir] Touch Screen Function added. [mode ${this.mode}]`);
  }
}
