'use strict';

const Mutex = require('./mutex');
const utils = require('./utils');

class Logger {
  constructor(path, maxLogSize) {
    this._mutex = new Mutex();
    this._reset(path);
    this._maxLogSize = maxLogSize;
  }

  _reset(path) {
    this._path = path;
  }

  log(data) {
    return new Promise((resolve, reject) => {
      this._mutex.acquire(() => {
        const serialized = JSON.stringify({
          data,
          timestamp: Date.now()
        });

        utils.appendFile(this._path, serialized)
          .then(() => {
            resolve();
            this._mutex.release();
          })
          .catch((err) => {
            reject(err);
            this._mutex.release();
          });
      });
    });
  }

  destroyIfLogFileSizeTooBig() {
    return new Promise((resolve, reject) => {
      this._mutex.acquire(() => {
        utils.readFileSize(this._path)
          .then(size => size > this._maxLogSize)
          .then((isTooBig) => {
            if (isTooBig) {
              return utils.deleteFile(this._path)
                .then(() => {
                  this._mutex.release();

                  // indicate the log file was deleted
                  return resolve(true);
                });
            }

            this._mutex.release();
            // indicate the log file was not deleted
            return resolve(false);
          })
          .catch((err) => {
            this._mutex.release();
            reject(err);
          });
      });
    });
  }

  flush() {
    return new Promise((resolve, reject) => {
      this._mutex.acquire(() => {
        const path = this._path;
        const tempPath = `${this._path}.tmp`;

        copyReadDeleteLogFile(path, tempPath)
          .then((result) => {
            this._reset(path);
            resolve(result);
            this._mutex.release();
          })
          .catch((err) => {
            if (err.code === 'ENOENT') {
              resolve('');
            } else {
              reject(err);
            }

            this._mutex.release();
          });
      });
    });
  }
}

function copyReadDeleteLogFile(from, to) {
  // Sequentially execute these tasks
  function copyFile() {
    return utils.copyFile(from, to);
  }

  function readFile() {
    return utils.readFile(to);
  }

  function deleteFile(result) {
    return utils.deleteFile(from)
      .then(() => result);
  }

  return [copyFile, readFile, deleteFile]
    .reduce((p, fn) => p.then(fn), Promise.resolve());
}

module.exports = Logger;
