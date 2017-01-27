const winston = require('winston');
const utils = require('./utils');

class Logger {
  constructor(path) {
    this._reset(path);
  }

  _reset(path) {
    this._isWriting = false;
    this._path = path;
    this._logger = new (winston.Logger)({
      transports: [
        new (winston.transports.File)({ filename: path })
      ]
    });
  }

  write(message, body, no) {
    const self = this;
    function doWrite() {
      console.log(`Writer ${no} start writing`);
      self._isWriting = true;

      return new Promise((resolve, reject) => {
        self._logger.log('info', message, { body }, (err, _type, msg, { body }) => {
          self._isWriting = false;
          console.log(`Writer ${no} done writing`);

          if (err) return reject(err);
          return resolve({ message: msg, body: body });
        });
      });
    }

    function loop(resolve, reject) {
      if (self._isWriting === false) {
        doWrite()
          .then(resolve)
          .catch(reject);
      } else {
        setTimeout(loop, 0, resolve, reject);
      }
    }

    return new Promise(loop);
  }

  flush() {
    const self = this;
    function doFlush() {
      const path = self._path;
      const tempPath = `${self._path}.tmp`;

      return Promise.all([
        utils.copyFile(path, tempPath),
        utils.readFile(tempPath),
        utils.deleteFile(path)
      ])
      .then((result) => {
        self._reset(path);
        return result[1];
      })
      .catch((err) => {
        if (err.code === 'ENOENT') {
          return '';
        }

        throw err;
      });
    }

    function loop(resolve, reject) {
      if (self._isWriting === false) {
        console.log("Flush is happening");
        doFlush()
          .then((data) => {
            console.log("Success flushing")
            resolve(data);
          })
          .catch((err) => {
            console.log("Error flushing")
            reject(err);
          });
      } else {
        console.log("Flush not allowed");
        setTimeout(loop, 0, resolve, reject);
      }
    }

    return new Promise(loop);
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
