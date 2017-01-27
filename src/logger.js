const winston = require('winston');
const locks = require('locks');
const utils = require('./utils');

class Logger {
  constructor(path) {
    this._mutex = locks.createMutex();
    this._reset(path);
  }

  _reset(path) {
    this._path = path;
    this._logger = new (winston.Logger)({
      transports: [
        new (winston.transports.File)({ filename: path })
      ]
    });
  }

  write(message, body) {
    return new Promise((resolve, reject) => {
      this._mutex.lock(() => {
        this._logger.log('info', message, { body }, (err, _type, msg, { body }) => {
          if (err) {
            reject(err);
          } else {
            resolve({ message: msg, body });
          }

          return this._mutex.unlock();
        });
      });
    });
  }

  flush() {
    return new Promise((resolve, reject) => {
      this._mutex.lock(() => {
        const path = this._path;
        const tempPath = `${this._path}.tmp`;

        return Promise.all([
          utils.copyFile(path, tempPath),
          utils.readFile(tempPath),
          utils.deleteFile(path)
        ])
        .then((result) => {
          this._reset(path);
          resolve(result[1]);

          this._mutex.unlock();
        })
        .catch((err) => {
          if (err.code === 'ENOENT') {
            resolve('');
            this._mutex.unlock();
          } else {
            reject(err);
            this._mutex.unlock();
          }
        });
      });
    });
  }

  // This method is not being used currently
  // Just in case we need to write when shutdown
  // https://github.com/winstonjs/winston/issues/228
  // log then exit(1)
  // writeBeforeShutdown(message, body) {
  //   this._logger.error('error', message, { body }, (err) => {
  //     if (err) { process.exit(1); }

  //     let numFlushes = 0;
  //     let numFlushed = 0;

  //     Object.keys(this._logger.transports).forEach((k) => {
  //       if (this._logger.transports[k]._stream) {
  //         numFlushes += 1;
  //         this._logger.transports[k]._stream.once('finish', () => {
  //           numFlushed += 1;
  //           if (numFlushes === numFlushed) {
  //             process.exit(1);
  //           }
  //         });
  //         this._logger.transports[k]._stream.end();
  //       }
  //     });

  //     if (numFlushes === 0) {
  //       process.exit(1);
  //     }
  //   });
  // }
}

module.exports = Logger;
