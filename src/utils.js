const fs = require('fs');

const readFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, { encoding: 'utf-8' }, (err, data) => {
      if (err) return reject(err);
      return resolve(data);
    });
  });
};

const deleteFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
};

const copyFile = (source, target) => {
  return new Promise((resolve, reject) => {
    let callbackCalled = false;

    const read = fs.createReadStream(source);
    read.on('error', done);

    const write = fs.createWriteStream(target);
    write.on('error', done);
    write.on('close', () => done());

    read.pipe(write);

    function done(err) {
      if (!callbackCalled) {
        if (err) {
          reject(err);
        } else {
          resolve(err);
        }
        callbackCalled = true;
      }
    }
  });
};

module.exports = {
  readFile,
  deleteFile,
  copyFile
};
