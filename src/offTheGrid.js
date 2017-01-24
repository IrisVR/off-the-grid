const Logger = require('./logger');

class OffTheGrid {
  constructor({
    logFilePath,
    interval,
    isOnline,
    replayImmediately,
    callback
  }) {
    this._logFilePath = logFilePath;
    this._interval = interval || (1000 * 60 * 30);
    this._isOnline = isOnline || false;

    if (typeof replayImmediately === 'undefined') {
      this._replayImmediately = false;
    } else {
      this._replayImmediately = replayImmediately;
    }

    this._callback = callback;

    this._logger = new Logger(logFilePath);

    const self = this;
    function loop() {
      if (self._isOnline) {
        self._replay();
      }

      setTimeout(loop, self._interval);
    }

    if (this._isOnline && this._replayImmediately) {
      loop();
    } else {
      setTimeout(loop, this._interval);
    }
  }

  setOnline() {
    this._isOnline = true;
  }

  setOffline() {
    this._isOnline = false;
  }

  record(message, body) {
    return this._logger.write(message, body);
  }

  _replay() {
    return this._logger.flush()
      .then((data) => {
        if (data !== '') {
          const dataArr = data.split('\n');
          if (dataArr[dataArr.length - 1] === '') {
            dataArr.splice(-1, 1);
          }

          return dataArr.map(JSON.parse);
        }

        return [];
      })
      .then((data) => {
        data.forEach(this._callback);
      });
  }
}

module.exports = OffTheGrid;
