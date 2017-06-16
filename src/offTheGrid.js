'use strict';

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
  constructor(options) {
    this._logFilePath = options.logFilePath || process.cwd();
    this._replayImmediately = options.replayImmediately || false;
    this._flushInterval = options.flushInterval || (1000 * 60 * 30); // 30 mins
    this._cacheSize = options.cacheSize || 10000000; // 10 MB

    this._checkerFunction = options.checkConditionBeforeFlush;

    this._checkConditionBeforeFlush = () => {
      return new Promise((resolve) => {
        if (this._checkerFunction === null ||
            typeof this._checkerFunction === 'undefined') {
          return resolve(true);
        }

        return resolve(this._checkerFunction());
      });
    };

    this._callback = options.callback || (() => {});

    this._logger = new Logger(options.logFilePath, this._cacheSize);

    // for testing purposes
    // we need to clear all the timeouts
    this._timeouts = [];

    const self = this;
    function loop() {
      self._checkConditionBeforeFlush()
        .then((conditionSatisfied) => {
          if (conditionSatisfied) {
            return self._replay();
          }

          return self._logger.destroyIfLogFileSizeTooBig();
        });

      self._timeouts.push(setTimeout(loop, self._flushInterval));
    }

    if (this._replayImmediately) {
      loop();
    } else {
      this._timeouts.push(setTimeout(loop, this._flushInterval));
    }
  }

  _clearTimeouts() {
    this._timeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
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
        return result.forEach(this._callback);
      });
  }
}

module.exports = OffTheGrid;
