const winston = require('winston');
const AsyncLock = require('async-lock');
const utils = require('./utils');

class Logger {
  constructor(path) {
    this._lock = new AsyncLock();
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
    return this._lock.acquire('lock', () => {
      return new Promise((resolve, reject) => {
        this._logger.log('info', message, { body }, (err, _type, msg, { body }) => {
          if (err) return reject(err);
          return resolve(msg, body);
        });
      });
    });
  }

  flush() {
    return this._lock.acquire('lock', () => {
      const path = this._path;
      const tempPath = `${this._path}.tmp`;

      return Promise.all([
        utils.copyFile(path, tempPath),
        utils.readFile(tempPath),
        utils.deleteFile(path)
      ])
      .then((result) => {
        this._reset(path);
        return result[1];
      })
      .catch((err) => {
        if (err.code === 'ENOENT') {
          return '';
        }

        throw err;
      });
    });
  }

  // This method is not being used currently
  // Just in case we need to write when shutdown
  // https://github.com/winstonjs/winston/issues/228
  // log then exit(1)
  writeBeforeShutdown(message, body) {
    this._logger.error('error', message, { body }, (err) => {
      if (err) { process.exit(1); }

      let numFlushes = 0;
      let numFlushed = 0;

      Object.keys(this._logger.transports).forEach((k) => {
        if (this._logger.transports[k]._stream) {
          numFlushes += 1;
          this._logger.transports[k]._stream.once('finish', () => {
            numFlushed += 1;
            if (numFlushes === numFlushed) {
              process.exit(1);
            }
          });
          this._logger.transports[k]._stream.end();
        }
      });

      if (numFlushes === 0) {
        process.exit(1);
      }
    });
  }
}

module.exports = Logger;
