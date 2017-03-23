const Logger = require('./logger');

function parseJSON(el) {
  let parsed;
  try {
    parsed = JSON.parse(el);
  } catch (e) {
    parsed = {};
  }

  return parsed;
}

function filterOutEmptyData(el) {
  return (Object.keys(el).length !== 0 &&
          el.constructor === Object);
}

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

  record(data) {
    return this._logger.log(data);
  }

  _replay() {
    return this._logger.flush()
      .then((result) => {
        const resultArr = result.split('\n');

        if (resultArr[resultArr.length - 1] === '') {
          resultArr.splice(-1, 1);
        }

        return resultArr.map(parseJSON)
        .filter(filterOutEmptyData);
      })
      .then((result) => {
        result.forEach(this._callback);
      });
  }
}

module.exports = OffTheGrid;
