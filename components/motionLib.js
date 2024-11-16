/************
* motionLib *
* Bugsounet *
*************/

/* global DiffCamEngine, _logPIR */
/* eslint-disable-next-line */
class motionLib {
  constructor (Config, Tools) {
    this.config = Config;
    this.wakeup = () => Tools.wakeup();
    this.sendNotification = (...args) => Tools.sendNotification(...args);
    if (this.config.captureIntervalTime < 1000) this.config.captureIntervalTime = 1000;
    if (this.config.scoreThreshold < 20) this.config.scoreThreshold = 20;
    if (this.config.deviceId === 1) this.config.deviceId = null;
    console.log("[MMM-Pir] [MOTION] motionLib Ready");
  }

  start () {
    const canvas = document.createElement("canvas");
    const video = document.createElement("video");
    const cameraPreview = document.createElement("div");
    cameraPreview.id = "cameraPreview";
    cameraPreview.style = "visibility:hidden;";
    cameraPreview.appendChild(video);

    DiffCamEngine.init({
      video: video,
      deviceId: this.config.deviceId,
      captureIntervalTime: this.config.captureIntervalTime,
      motionCanvas: canvas,
      scoreThreshold: this.config.scoreThreshold,
      initSuccessCallback: () => {
        _logPIR("DiffCamEngine init successful.");
        DiffCamEngine.start();
      },
      initErrorCallback: (error) => {
        console.error(`[MMM-Pir] [MOTION] DiffCamEngine init failed: ${error}`);
        this.sendNotification("SHOW_ALERT", {
          type: "notification",
          title: "MMM-Pir",
          message: `Motion Error detected: ${error}`,
          timer: 15000
        });
      },
      startCompleteCallback: () => {
        _logPIR("[MOTION] Motion is now Started");
      },
      stopCompleteCallback: () => {
        _logPIR("[MOTION] Motion is now Stopped");
      },
      destroyCompleteCallback: () => {
        _logPIR("[MOTION] Motion is now Destroyed");
      },
      captureCallback: ({ score, hasMotion }) => {
        if (hasMotion) {
          _logPIR(`[MOTION] Motion detected, score ${score}`);
          this.wakeup();
        }
      }
    });
  }
}
