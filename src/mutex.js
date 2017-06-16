'use strict';

class Mutex {
  constructor() {
    this._isAcquired = false;
    this._waiting = [];
  }

  acquire(callback) {
    if (this._isAcquired) {
      this._waiting.push(callback);
    } else {
      this._isAcquired = true;
      callback.call(this);
    }
  }

  release() {
    if (!this._isAcquired) {
      throw new Error('Mutex is not acquired');
    }

    const func = this._waiting.shift();

    if (func) {
      func.call(this);
    } else {
      this._isAcquired = false;
    }
  }
}

module.exports = Mutex;
