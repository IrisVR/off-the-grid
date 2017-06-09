const fs = require('fs');

const appendFile = (path, data) => {
  return new Promise((resolve, reject) => {
    fs.appendFile(path, `${data}\n`, { encoding: 'utf8' }, (err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
};

const readFileSize = (path) => {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stat) => {
      if (err) return reject(err);
      return resolve(stat.size);
    });
  });
};

const readFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, { encoding: 'utf8' }, (err, data) => {
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
  appendFile,
  readFile,
  readFileSize,
  deleteFile,
  copyFile
};
