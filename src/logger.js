const Mutex = require('./mutex');
const utils = require('./utils');

class Logger {
  constructor(path) {
    this._mutex = new Mutex();
    this._reset(path);
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

  flush() {
    return new Promise((resolve, reject) => {
      this._mutex.acquire(() => {
        const path = this._path;
        const tempPath = `${this._path}.tmp`;

        // Sequentially execute these tasks
        function copyFile() {
          return utils.copyFile(path, tempPath);
        }

        function readFile() {
          return utils.readFile(tempPath);
        }

        function deleteFile(result) {
          return utils.deleteFile(path)
            .then(() => result);
        }

        [copyFile, readFile, deleteFile]
        .reduce((p, fn) => p.then(fn), Promise.resolve())
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

module.exports = Logger;
